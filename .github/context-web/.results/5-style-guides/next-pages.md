# Next.js Pages Style Guide - apps/web

## Core Principles

- **Location**: All pages must be named `page.tsx` within the `src/app` directory.
- **Server vs Client**: Prefer Server Components for data fetching where possible. Use `"use client"` only for interactive parts.
- **Data Fetching**: Use `fetchApi` directly in Server Components or dispatch thunks in Client Components.

## Implementation Patterns

### Static/Server Page
```tsx
export default async function Page() {
  // Direct data fetching for SEO
  return (
    <div className="container mx-auto px-4">
      <h1>Title</h1>
    </div>
  );
}
```

### Dynamic Page
Use `params` to access URL parameters.

```tsx
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <div>Product: {slug}</div>;
}
```

## Naming Conventions
- Directory names should be `kebab-case`.
- Page file must always be `page.tsx`.
