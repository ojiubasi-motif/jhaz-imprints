# Payments Domain — Deep Dive

## Overview
Paystack payment integration for Nigerian Naira (NGN) transactions. Three-step flow: Initialize → Customer pays → Verify via webhook.

## Initialize Payment
```typescript
export async function initializePayment(email, amount, reference, metadata?) {
  const response = await fetch(`${PAYSTACK_API_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: amount * 100, reference, metadata }),  // Naira → kobo
  });
  return { authorizationUrl: data.data.authorization_url, accessCode, reference };
}
```

## Verify Payment
```typescript
export async function verifyPayment(reference) {
  const response = await fetch(`${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`, { ... });
  return { status: data.data.status, amount: data.data.amount / 100 }; // kobo → Naira
}
```

## Idempotent Webhook
Double-check locking pattern in `confirmPayment()`:
1. Check if payment already COMPLETED (outside transaction)
2. Verify with Paystack API
3. Re-check inside `$transaction` to prevent race conditions
4. Update payment + order status atomically
5. Enqueue notification only if this call did the processing

## Reference Format
`order_{orderId}_{timestamp}` — globally unique, used as idempotency key.

## Currency
All amounts in Nigerian Naira (NGN). Paystack expects kobo (×100). Stored in Naira in database.
