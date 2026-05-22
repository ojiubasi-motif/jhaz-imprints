# React Components Style Guide - apps/web

## Core Principles

- **Functional Components**: Use `export function ComponentName()` instead of arrow functions or default exports.
- **Client Directives**: Add `"use client"` at the very top if the component uses hooks (State, Effects, Redux).
- **Styling**: Use utility-first Tailwind CSS. Use custom theme colors (`primary`, `secondary`, `error`) where appropriate.
- **Next.js Integration**: Use `next/link` for navigation and `next/image` for media.

## Implementation Patterns

### Standard Component Template
```tsx
"use client";

import { useAppSelector } from "@/store/hooks";

export function CustomButton({ label }: { label: string }) {
  const { isLoading } = useAppSelector(state => state.ui);
  
  return (
    <button className="btn-primary px-4 py-2 disabled:opacity-50">
      {isLoading ? "Loading..." : label}
    </button>
  );
}
```

### Layout Wrapping
Use semantic HTML (header, main, footer) and standard Tailwind spacing classes (mx-auto, px-4).

## Naming Conventions
- Files should be `PascalCase.tsx`.
- Folders should be `lowercase`.
