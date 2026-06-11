# API Services Domain Analysis - packages/api

## Patterns and Conventions

- **Stateless Logic**: Services are typically static classes or exported async functions that take inputs and return data.
- **Transactional Integrity**: Uses Prisma `$transaction` for operations requiring atomicity across multiple tables.
- **Error Propagation**: Throws custom `AppError` instances with status codes and specific error codes.
- **Cached Database Orchestration**: Catalog events are replicated to a local cache replica (`CachedProduct` in PostgreSQL) which is populated by Redis streams. However, standard transactional logic queries the live catalog MongoDB collections directly to ensure real-time consistency.

## Code Examples

### Transactional Service Pattern (with Defensive Validation & Order Snapshotting)
```typescript
export async function createOrder(userId: string, input: CreateOrderInput) {
  // 1. Pre-flight validation — NO database calls yet
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new AppError("No items provided in the order", 400);
  }

  const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
  const FABRIC_ID_RE = /^[a-f\d]{24}(::.+)?$/i;

  for (const item of input.items) {
    if (!item.productId || !OBJECT_ID_RE.test(item.productId)) {
      throw new AppError(`Invalid or missing productId: "${item.productId ?? ""}"`, 400);
    }
    if (item.fabricId !== undefined && !FABRIC_ID_RE.test(item.fabricId)) {
      throw new AppError(`Invalid fabricId format: "${item.fabricId}"`, 400);
    }
  }

  // 2. Fetch catalog details directly from MongoDB (via Mongoose models)
  const allOrders: any[] = [];
  let totalOrderAmount = 0;

  for (const item of input.items) {
    const mongoProduct = await Product.findById(item.productId).lean();
    if (!mongoProduct) {
      throw new AppError(`Product not found: productId=${item.productId}`, 404);
    }

    let fabricPriceModifier = 0;
    let resolvedFabricName = "Standard";
    let resolvedFabricId: string | null = null;
    let yardsPerUnit = 1.0;
    let fabricUnit = "yard";

    if (item.fabricId) {
      const [cleanFabricId, selectedColorName] = item.fabricId.split("::");
      const fabricDoc = await Fabric.findById(cleanFabricId).lean();
      if (!fabricDoc) {
        throw new AppError(`Fabric not found: fabricId=${cleanFabricId}`, 404);
      }

      let prop = null;
      if (selectedColorName && fabricDoc.properties) {
        prop = fabricDoc.properties.find(
          (p) => p.colorName.toLowerCase() === selectedColorName.toLowerCase()
        ) ?? null;
      }
      if (!prop && fabricDoc.properties && fabricDoc.properties.length > 0) {
        prop = fabricDoc.properties[0];
      }

      fabricPriceModifier = prop?.priceModifier ?? 0;
      resolvedFabricName = prop ? `${fabricDoc.name} — ${prop.colorName}` : fabricDoc.name;
      resolvedFabricId = cleanFabricId;
      yardsPerUnit = prop?.yardsPerUnit ?? 1.0;
      fabricUnit = prop?.unit ?? "yard";
    }

    const estimatedYards = calculateFabricYards(item.measurement);
    const unitsNeeded = Math.ceil(estimatedYards / yardsPerUnit);
    const totalFabricModifier = fabricPriceModifier * unitsNeeded;

    const inputStyleSafe = (item.styleOptionName ?? "Standard").trim();
    let stylePriceModifier = 0;
    let resolvedStyleName = inputStyleSafe;

    if (inputStyleSafe.toLowerCase() !== "standard" && inputStyleSafe.toLowerCase() !== "original") {
      const styleOpt = mongoProduct.styleOptions?.find(
        (s) => s.name.toLowerCase() === inputStyleSafe.toLowerCase()
      );
      if (!styleOpt) {
        throw new AppError(`Style option "${inputStyleSafe}" not found`, 404);
      }
      stylePriceModifier = styleOpt.priceModifier ?? 0;
      resolvedStyleName = styleOpt.name;
    }

    const itemTotal = computeOrderTotal({
      basePrice: mongoProduct.basePrice,
      fabricPriceModifier: totalFabricModifier,
      stylePriceModifier,
    });

    totalOrderAmount += itemTotal;

    allOrders.push({
      productId: item.productId,
      productName: mongoProduct.name,
      measurement: item.measurement,
      fabricId: resolvedFabricId,
      fabricOptionName: resolvedFabricName,
      styleOptionName: resolvedStyleName,
      colorName: resolvedFabricName.includes(" — ") ? resolvedFabricName.split(" — ")[1] : null,
      basePrice: mongoProduct.basePrice,
      styleModifier: stylePriceModifier,
      fabricPricePerUnit: fabricPriceModifier,
      fabricQty: unitsNeeded,
      fabricUnit: fabricUnit,
      fabricYards: estimatedYards,
      yardsPerUnit: yardsPerUnit,
      fabricModifier: totalFabricModifier,
      totalAmount: itemTotal,
      notes: item.notes ?? null,
    });
  }

  // 3. Verify price integrity
  let deliveryFee = 0;
  if (input.delivery) {
    deliveryFee = input.delivery.deliveryMethod === "express" ? 7500 : 3500;
  }
  let discount = 0;
  if (input.promoCode === "JHAZ10") {
    discount = (totalOrderAmount + deliveryFee) * 0.1;
  }
  const grandTotal = totalOrderAmount + deliveryFee - discount;

  if (input.expectedTotal !== undefined && Math.abs(grandTotal - input.expectedTotal) > 1) {
    throw new AppError(`Price mismatch`, 409);
  }

  const notesMetadata = JSON.stringify({
    delivery: input.delivery,
    promoCode: input.promoCode,
  });

  // 4. Perform atomic update in PostgreSQL (saving inline JSON snapshots)
  const result = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        items: allOrders,
        totalAmount: grandTotal,
        status: "PENDING",
        notes: notesMetadata,
      },
      include: { user: true },
    });

    const reference = `order_${newOrder.id}_${Date.now()}`;
    const payment = await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: grandTotal,
        status: "PENDING",
        reference,
        provider: "PAYSTACK",
      },
    });

    return { order: newOrder, payment, reference };
  });

  return result;
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
    orderBy: { createdAt: 'desc' }
  });
}

export async function createMeasurement(userId: string, input: MeasurementCreate) {
  const measurement = await prisma.measurement.create({
    data: { userId, ...input }
  });
  return measurement;
}
`````
