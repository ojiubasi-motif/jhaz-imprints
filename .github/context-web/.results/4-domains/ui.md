# UI Domain Analysis - apps/web

## Patterns and Conventions

- **Component Structure**: Functional components using the `export function ComponentName()` pattern.
- **Styling**: Exclusively uses **Tailwind CSS**.
- **Theming**: Custom colors defined in `tailwind.config.ts`:
  - `primary`: `#8B5A2B` (African-inspired Brown)
  - `secondary`: `#D4AF37` (Gold accent)
- **Reusable Utility Classes**: Defined in `globals.css` using `@apply`:
  - `.btn-primary`
  - `.btn-secondary`
  - `.card`
  - `.input`
- **Next.js Optimizations**:
  - Uses `next/image` for all images with `fill` or explicit dimensions.
  - Uses `next/link` for client-side navigation.
- **Error Boundaries**: Critical multi-step flows (like Checkout) are wrapped in a `CheckoutErrorBoundary` to isolate failures.
- **Network Status**: Components in the checkout flow use `navigator.onLine` to display real-time network status warnings and toggle offline-ready functionality.
- **Augmented Order Display**: When rendering order lists (`OrderCard`) or details (`OrderStatusPage`), always use the `order.product` object for images and names. This provides a rich, visually consistent experience even for historical orders.

## Code Examples

### Standard Card Pattern
```tsx
<div className="card h-full transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col">
  <div className="aspect-[3/4] w-full overflow-hidden rounded bg-gray-200 mb-4 relative">
    <Image
      src={imageUrl}
      alt={product.name}
      fill
      className="object-cover object-center group-hover:opacity-75 transition-opacity"
    />
  </div>
  {/* Content */}
</div>
```

### Form Input Pattern
```tsx
<input
  type="email"
  className="input w-full"
  placeholder="Enter your email"
  {...register("email")}
/>
```

### Primary Button
```tsx
<button type="submit" className="btn-primary w-full py-3">
  Sign In
</button>
```
