# ui-components Style Guide

Unique conventions for UI components in this project:

- **Radix UI Foundation**: All interactive primitive UI elements (tabs, accordions, dialogs, sliders) must be built using Radix UI via Shadcn UI patterns.
- **Tailwind Class Merging**: Every UI component must support the `className` prop and merge classes securely using the `cn` utility from `lib/utils.ts`.
- **Forwarding Refs**: UI components must use `React.forwardRef` to pass refs down to the underlying DOM element or Radix primitive.
- **Variant Authority**: Use `class-variance-authority` (cva) for defining visual variants (like button sizes and colors).

Example:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
```
