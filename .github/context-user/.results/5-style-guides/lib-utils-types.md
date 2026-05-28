# lib-utils-types Style Guide

Unique conventions for the lib and types category in this project:

- **Strict Order Types**: The order flow is strictly typed with `interfaces` defining exactly what steps contain (e.g. `OrderData`, `OutfitStyle`, `Measurements`) inside `lib/order-types.ts`.
- **Static Mock Data**: Catalog data is currently provided statically via arrays inside `lib/products-data.ts`, simulating a backend response.
- **Tailwind Merger**: A central `cn` function is implemented in `lib/utils.ts` utilizing `clsx` and `tailwind-merge` to resolve styling conflicts dynamically, a hallmark of Shadcn-based projects.

Example:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
