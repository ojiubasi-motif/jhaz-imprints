# Routing Domain Analysis - apps/web

## Patterns and Conventions

- **Next.js App Router**: Uses the standard `src/app` directory for file-based routing.
- **Route Structure**:
  - `page.tsx`: Defines the main content for a route.
  - `layout.tsx`: Defines the layout shared across a segment and its children.
  - `[slug]/page.tsx`: Handles dynamic parameters.
- **API Routes**: Located in `src/app/api/` for internal API endpoints if any (mostly proxies or webhooks).
- **Navigation**: Client-side navigation via `next/link`.

## Code Examples

### Dynamic Product Route (`src/app/products/[slug]/page.tsx`)
```tsx
export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  // Fetch logic
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product content */}
    </div>
  );
}
```

### Main Layout (`src/app/layout.tsx`)
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 flex flex-col min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```
