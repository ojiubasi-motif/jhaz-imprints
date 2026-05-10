# Notifications Domain — Deep Dive

## Overview
Async notification pipeline using BullMQ with Redis. Email is the only channel. Jobs are dispatched after order events and processed by a background worker.

## Queue Setup
```typescript
export const notificationQueue = new Queue("notifications", {
  connection: { host: process.env.REDIS_HOST || "localhost", port: parseInt(process.env.REDIS_PORT || "6379") },
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
});
```

## Job Dispatch
Jobs are added after order state changes:
```typescript
await notificationQueue.add("order-confirmed", {
  orderId, userId, userEmail, userPhone, userName, totalPrice, measurement,
});
```

## Worker
```typescript
const worker = new Worker("notifications", async (job) => {
  switch (job.name) {
    case "order-confirmed": await handleOrderConfirmed(job.data); break;
    case "status-updated": await handleStatusUpdated(job.data); break;
  }
}, { connection: { ... }, concurrency: 5 });
```

## Non-Fatal Send Pattern
Each notification is independently wrapped — one failure doesn't block others:
```typescript
if (jobData.userEmail) {
  try {
    await sendEmail(jobData.userEmail, template.subject, template.html);
  } catch (error) {
    console.error(`[Worker] ✗ Customer email failed`);
  }
}
```

## Email Templates
Pure functions returning `{ subject, html }` with inline CSS. Three templates:
- `orderConfirmedEmail(order)` — Customer confirmation
- `statusUpdateEmail(order, newStatus)` — Status change notification
- `adminOrderAlertEmail(order)` — Admin/tailor alert with measurements

## Email Transport
```typescript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});
```
