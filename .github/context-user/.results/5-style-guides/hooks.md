# hooks Style Guide

Unique conventions for hooks in this project:

- **Shadcn Origin**: Custom hooks in this repository (`use-toast.ts`, `use-mobile.ts`) are primarily utility hooks derived from the Shadcn UI ecosystem.
- **Client Only**: Hooks intrinsically rely on browser APIs (like `window.matchMedia` in `use-mobile.ts`) and must therefore be used within components marked with `"use client"`.

Example:
```ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    // ...
  }, [])

  return !!isMobile
}
```
