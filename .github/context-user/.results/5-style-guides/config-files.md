# config-files Style Guide

Unique conventions for configuration files in this project:

- **Shadcn Configuration**: `components.json` is used to configure Shadcn UI components (storing paths for aliases like `@/components` and `@/lib/utils`).
- **Next.js Modern Config**: Uses `next.config.mjs` (ES modules) rather than `next.config.js`.
- **Path Aliases**: TypeScript is configured in `tsconfig.json` to use `@/*` as an alias for `apps/user/*`.

Example `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```
