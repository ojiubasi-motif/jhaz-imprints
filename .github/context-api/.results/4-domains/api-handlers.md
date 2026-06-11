# API Handlers Domain Analysis - packages/api

## Patterns and Conventions

- **Quizio Envelope**: All handlers should return a standardized JSON envelope:
  ```json
  {
    "msg": "success message",
    "data": { ... },
    "type": "SUCCESS",
    "code": 600
  }
  ```
- **Async Handling**: Handlers use the `async/await` pattern. Errors are caught by a global error handler middleware.
- **Request Parsing**:
  - `req.body` for payloads (validated via Zod).
  - `req.params` for URL identifiers.
  - `req.query` for filtering/pagination.
- **Thin Controllers**: Logic is strictly delegated to services. Handlers primarily manage the HTTP interface.
- **Empty Responses**: Use `res.status(204).send()` for operations like deletion that do not require a response body.

## Code Examples

### Standard Success Handler
```typescript
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { user, access_token, refresh_token } = await AuthService.login(validatedData);
    
    // Cookie management
    res.cookie("jwt", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 60 * 1000,
    });

    res.status(200).json({
      msg: "login success",
      data: { user, access_token },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(401).json({
      msg: error.message || "Unauthorized",
      type: "FAILED",
      code: 605
    });
  }
};
```

### Delegation to Service
```typescript
export async function createOrderHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { order, paymentUrl, reference, accessCode, breakdown } = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json({
    msg: "order created successfully",
    data: {
      orderId: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      reference,
      paymentUrl,
      paystackAccessCode: accessCode,
      breakdown,
    },
    type: "SUCCESS",
    code: 600
  });
}
```

### Payment Intent Handler
Handlers that initialize a payment session return the Paystack transaction payload. Guard against non-PENDING orders before initializing payment.
```typescript
export async function createPaymentIntentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { orderId } = req.params;

  const paymentIntent = await orderService.initializeOrderPayment(
    req.user.id,
    orderId,
    req.user.email
  );

  res.json({
    msg: "payment intent created",
    data: paymentIntent,
    type: "SUCCESS",
    code: 600
  });
}
```

### User-Facing Payment Verify Handler
Called by the frontend after Paystack redirect. Delegates to the same `orderService.confirmPayment` as the Paystack webhook — idempotency is handled at the service level.
```typescript
export async function verifyPaymentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { reference } = req.params;

  if (!reference) {
    throw new AppError("Payment reference is required", 400);
  }

  const result = await orderService.confirmPayment(reference);

  res.json({
    msg: "payment verified successfully",
    data: {
      orderId: result.order?.id,
      status: result.order?.status || "CONFIRMED",
      alreadyProcessed: result.alreadyProcessed
    },
    type: "SUCCESS",
    code: 600
  });
}
```
