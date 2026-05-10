# Style Guide: React Pages

## Unique Conventions
- Next.js pages export a default function component matching the route segment
- `export const dynamic = "force-dynamic"` used on pages that need fresh data
- Pages receive `searchParams` as props in Next.js App Router
- Admin pages are named exports from `pages/` directory (e.g., `export function OrderQueue()`)
- Pages compose components and pass props down — minimal logic in page files
- Page titles use `text-3xl font-bold` Tailwind class
- Page layout: `<main className="min-h-screen">` wrapping `<div className="max-w-4xl mx-auto px-4 py-8">`
