# next-pages Style Guide

Unique conventions for Next.js page components in this project:

- **Minimal Page Components**: Page components are mostly thin wrappers that import and render `domain-components`. They do not typically contain complex business logic or styling.
- **Client Directives on Leaves**: Pages themselves are often React Server Components (RSC, no `"use client"` directive), while interactive state is pushed down to the imported `domain-components` (like `OrderFlow` or `ProductCatalog`).

Example:
```tsx
import { OrderFlow } from "@/components/order/order-flow"

export default function OrderPage() {
  return <OrderFlow />
}
```
