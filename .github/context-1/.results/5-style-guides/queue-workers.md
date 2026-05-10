# Style Guide: Queue Workers

## Unique Conventions
- Queue and Worker created from `bullmq` package
- Queue exported as module-level singleton: `export const notificationQueue = new Queue("notifications", { ... })`
- Worker uses switch/case on `job.name` to dispatch to handler functions
- Handler functions are file-private (not exported)
- Each external call (email, SMS) wrapped in individual try-catch — one failure never blocks others
- Safe defaults for all optional job data fields (e.g., `jobData.userName || "Customer"`)
- Worker started via `startNotificationWorker()` function called from `app.ts`
- Worker events logged: `worker.on("completed")`, `worker.on("failed")`
- Concurrency set to 5
