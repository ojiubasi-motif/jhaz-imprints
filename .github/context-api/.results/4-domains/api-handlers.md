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
  if (!req.user) throw new AppError("User not authenticated", 401);

  const result = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json({
    msg: "order created",
    data: result,
    type: "SUCCESS",
    code: 600
  });
}
```

### Payment Intent Handler
Handlers that initialize a payment session return the Paystack `accessCode` (for `PaystackPop` modal) and `authorizationUrl` (for redirect flows). Guard against non-PENDING orders before calling `initializePayment`.
```typescript
export async function createPaymentIntentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new AppError("User not authenticated", 401);
  const { orderId } = req.params;
  const order = await orderService.getOrderById(req.user.id, orderId);
  if (order.status !== "PENDING") {
    throw new AppError(`Cannot create payment intent for order with status: ${order.status}`, 400, "INVALID_ORDER_STATUS");
  }
  const paymentRef = `order_${order.id}_${Date.now()}`;
  const paymentIntent = await paystackService.initializePayment(req.user.email, order.totalAmount, paymentRef, { orderId: order.id, userId: req.user.id });
  res.json({
    msg: "payment intent created",
    data: {
      paystackAccessCode: paymentIntent.accessCode,
      paystackAuthorizationUrl: paymentIntent.authorizationUrl,
      reference: paymentIntent.reference,
      orderId: order.id,
      amount: order.totalAmount,
    },
    type: "SUCCESS",
    code: 600
  });
}
```

### User-Facing Payment Verify Handler
Called by the frontend after Paystack redirect. Delegates to the same `orderService.confirmPayment` as the Paystack webhook — idempotency is handled at the service level.
```typescript
export async function verifyPaymentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new AppError("User not authenticated", 401);
  const { reference } = req.params;
  const result = await orderService.confirmPayment(reference);
  res.json({
    msg: "payment verified successfully",
    data: { orderId: result.order?.id, status: result.order?.status || "CONFIRMED", alreadyProcessed: result.alreadyProcessed },
    type: "SUCCESS",
    code: 600
  });
}
```

### Admin Deletion Pattern (204 No Content)
Delete handlers use `res.status(204).send()` with no body — NOT a Quizio envelope.
```typescript
export async function deleteProductHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) throw new AppError("Invalid product ID", 400);
  await adminProductService.deleteProduct(id);
  res.status(204).send();
}
```
