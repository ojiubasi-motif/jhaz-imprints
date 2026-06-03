# API Services Domain Analysis - packages/api

## Patterns and Conventions

- **Stateless Logic**: Services are typically static classes or exported async functions that take inputs and return data.
- **Transactional Integrity**: Uses Prisma `$transaction` for operations requiring atomicity across multiple tables.
- **Error Propagation**: Throws custom `AppError` instances with status codes and specific error codes.
- **Cached Database Orchestration**: Instead of querying MongoDB directly at runtime, the API service queries a local cache replica (`CachedProduct` in PostgreSQL) which is populated by Redis streams.

## Code Examples

### Transactional Service Pattern (with Defensive Validation & Order Snapshotting)
```typescript
export async function createOrder(userId: string, input: CreateOrderInput) {
  // 1. Fetch catalog context from PostgreSQL Cache
  const product = await getCachedProductByIdOrSlug(input.productId);
  if (!product) throw new AppError("Product not found", 404);

  // 2. Defensive String Matching for options
  const inputFabricSafe = (input.fabricOptionName ?? "Standard").trim().toLowerCase();
  const inputStyleSafe = (input.styleOptionName ?? "Standard").trim().toLowerCase();

  // 3. Resilient Fallback for options
  const fabricOptions = product.fabricOptions as Array<{ name: string; priceModifier: number }>;
  let fabricOption = fabricOptions.find(
    (f) => f.name.trim().toLowerCase() === inputFabricSafe
  );
  if (!fabricOption && fabricOptions.length === 0) {
    fabricOption = { name: "Standard", priceModifier: 0 }; // Fallback
  }

  // 4. Perform atomic update in PostgreSQL
  const createdOrder = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: { 
        userId, 
        productId: input.productId,
        measurementId: input.measurementId,
        // Snapshot catalog details for history
        styleOptionName: input.styleOptionName,
        fabricOptionName: input.fabricOptionName,
        colorName: input.colorName,
        basePrice: product.basePrice,
        styleModifier: styleOption.priceModifier,
        fabricModifier: fabricOption.priceModifier,
        totalAmount, 
        status: "PENDING" 
      }
    });
    // ... create payment record
    return { order: newOrder, reference };
  });

  return createdOrder;
}
```

### Data Augmentation Pattern (Cached Product Lookup)
When fetching orders, services should bridge the relational order data with catalog data from the local `CachedProduct` replica.
```typescript
export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);

  // Augment with rich product data from local SQL cache
  const localProduct = await getCachedProductByIdOrSlug(order.productId);
  
  return {
    ...order,
    product: localProduct || null,
  };
}
```

### Error Handling
```typescript
if (!isPasswordValid) {
  throw new AppError("Invalid email or password", 401);
}
```

### Token Rotation Pattern
```typescript
static async refresh(token: string) {
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) {
    throw new Error("Invalid refresh token");
  }

  const access_token = this.generateAccessToken(user);
  const new_refresh_token = this.generateRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: new_refresh_token },
  });

  return { user, access_token, refresh_token: new_refresh_token };
}
```

### Response Sanitization Pattern
```typescript
const { createdAt, updatedAt, password, refreshToken, ...sanitized } = result;
res.status(200).json({
  msg: "success",
  data: sanitized,
  type: "SUCCESS",
  code: 600
});
```

### Measurement Service Methods

The API exposes services for managing customer measurement profiles. Services must be simple, stateless functions that validate input (shared schemas) and persist via Prisma. Always return sanitized shapes to handlers.

Example: `getUserMeasurements` and `createMeasurement`
```typescript
export async function getUserMeasurements(userId: string) {
  return prisma.measurement.findMany({
    where: { userId },
    select: {
      id: true,
      profileName: true,
      chest: true,
      waist: true,
      hip: true,
      shoulder: true,
      armLength: true,
      length: true,
      notes: true,
      isDefault: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createMeasurement(userId: string, input: MeasurementCreate) {
  const measurement = await prisma.measurement.create({
    data: { userId, ...input }
  });
  return measurement;
}
```

Guidance:
- Services should not return raw Prisma models with `createdAt`/`updatedAt` — handlers must sanitize before sending to clients.
- Prefer `select` projections in service queries when the full model is not required by downstream logic.

### Parallel Order Augmentation (N+1 Prevention)
When augmenting multiple orders, query the local database Cache. Always handle missing products gracefully with `try/catch` and fallback to `null`.
```typescript
export async function getUserOrders(userId: string, skip = 0, take = 10) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { measurement: true, payment: true, statusHistory: true },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  const augmentedOrders = await Promise.all(
    orders.map(async (order) => {
      let product = null;
      try {
        product = await getCachedProductByIdOrSlug(order.productId);
      } catch {
        // Product may have been deleted; return order without product data
      }
      return { ...order, product: product || null };
    })
  );

  return { orders: augmentedOrders, total: await prisma.order.count({ where: { userId } }), skip, take };
}
```
