# UI Domain Deep Dive

The UI domain in this codebase focuses on building accessible, consistent, and beautiful components using Shadcn UI (Radix UI) and Tailwind CSS.

## Patterns and Conventions

- **Component Primitives**: The UI relies on Shadcn UI primitives placed in `apps/user/components/ui/`. These components use Radix UI under the hood for accessibility.
- **Styling**: Tailwind CSS is used extensively with custom design tokens. Utility classes are combined using a `cn` utility function from `lib/utils.ts`.
- **Client Directives**: Components that use interactive state (like `useState` or Radix UI primitives that need client context) must declare `"use client"` at the top of the file.

## Real Code Example

From `apps/user/components/ui/card.tsx`:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
```
