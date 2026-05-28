# Catalog Domain Deep Dive

The Catalog domain is responsible for displaying products, styles, and fabrics to the user, allowing them to browse and filter.

## Patterns and Conventions

- **Component Composition**: The catalog is broken down into modular components: `product-catalog.tsx` serves as the container, utilizing `search-bar.tsx`, `filter-sidebar.tsx`, and `product-grid.tsx` for presentation.
- **Empty States**: Views that render lists (like `product-grid.tsx`) explicitly handle empty states with helpful UI and messaging.
- **Grid Layouts**: Product lists heavily utilize Tailwind's CSS grid classes for responsive layouts (e.g., `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).

## Real Code Example

From `apps/user/components/catalog/product-grid.tsx`:
```tsx
"use client"

import { ProductCard, type Product } from "./product-card"

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {/* Empty state SVG icon and text */}
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
          No styles found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your filters or search terms to find the perfect traditional outfit for you.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```
