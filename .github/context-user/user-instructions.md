# AI Coding Assistant Meta-Instructions for `apps/user`

## 1. Overview Section

The purpose of this file is to enable AI coding assistants to generate features that are perfectly aligned with the `apps/user` project’s specific architecture, conventions, and style. 
This document is based strictly on actual, observed patterns within the `apps/user` Next.js codebase—it does not rely on invented best practices. By following these instructions, an AI assistant will ensure that all newly generated code respects the project's boundaries, styling choices, and component hierarchies.

## 2. File Category Reference

### `next-pages`
- **What it is**: Next.js route entry points.
- **Examples**: `app/page.tsx`, `app/order/page.tsx`
- **Conventions**: Pages are minimal wrappers (usually React Server Components) that import and render complex client-side domain components. They do not handle heavy business logic directly.

### `ui-components`
- **What it is**: Reusable, primitive UI building blocks.
- **Examples**: `components/ui/button.tsx`, `components/ui/card.tsx`
- **Conventions**: Built using Radix UI via Shadcn UI patterns. They must forward refs, support standard HTML attributes, and use the `cn` utility from `lib/utils.ts` to merge Tailwind classes securely.

### `domain-components`
- **What it is**: Feature-specific components related to the business logic (e-commerce, tailoring).
- **Examples**: `components/order/order-flow.tsx`, `components/catalog/product-grid.tsx`
- **Conventions**: Colocated by feature (e.g. `order/`, `catalog/`). Complex state is centralized in a parent "Flow" component, which delegates slices of state to stateless child "Step" components.

### `hooks`
- **What it is**: Custom React hooks.
- **Examples**: `hooks/use-mobile.ts`, `hooks/use-toast.ts`
- **Conventions**: Often derived from Shadcn utilities, used exclusively inside client components (files marked with `"use client"`), and rely on browser APIs.

### `lib-utils-types`
- **What it is**: Shared utilities, mock data, and TypeScript types.
- **Examples**: `lib/order-types.ts`, `lib/utils.ts`
- **Conventions**: Strict typing for business entities (`OrderData`, `Measurements`). Uses a central `cn` function for Tailwind class merging.

### `styles`
- **What it is**: Global stylesheets.
- **Examples**: `app/globals.css`
- **Conventions**: Utilizes CSS variables for theming (`--primary`, `--background`) and integrates via Tailwind v4 syntax (`@theme`). CSS Modules are strictly avoided.

### `config-files`
- **What it is**: Project configuration.
- **Examples**: `next.config.mjs`, `components.json`
- **Conventions**: Standard modern JS tooling utilizing ES modules, path aliases (`@/`), and Shadcn CLI configuration.

### `public-assets`
- **What it is**: Static images and icons.
- **Examples**: `public/images/products/agbada-brown-gold.jpg`
- **Conventions**: Organized in specific folders (e.g., `products/`). Uses kebab-case, strictly descriptive names.

## 3. Feature Scaffold Guide

When implementing a new feature, follow this scaffolding process:

1. **Determine Required Components**:
   - Do you need a new route? Create a new folder with a `page.tsx` in `apps/user/app/`.
   - Does it require a primitive UI element? Create a new file in `apps/user/components/ui/`.
   - Does it involve business logic? Create a new file in `apps/user/components/{feature-name}/`.

2. **File Placement & Naming**:
   - Use kebab-case for all component files (e.g., `feature-card.tsx`).
   - Group related domain components into feature subdirectories instead of cluttering the root `components/` folder.

3. **Dependencies**:
   - If a component requires state, add `"use client"` at the top.
   - Use the `cn` function from `@/lib/utils` for dynamic class names.
   - Avoid creating CSS Modules. Put all necessary styling directly into Tailwind classes.

## 4. Integration Rules

- **Accessibility**: All generic interactive elements must be built upon Radix UI primitives.
- **State Management**: For multi-step or complex flows, hoist the state to a parent controller component using `useState`, and pass data/callbacks as props down to purely presentational child components.
- **Styling**: Always use the predefined Tailwind theme variables (e.g., `text-primary`, `bg-card`) rather than raw hex codes, unless matching a specific brand color not in the theme (e.g., `bg-[#1B4332]`).
- **Client Boundaries**: Do not put `"use client"` in page entry points (`page.tsx`) unless strictly necessary. Push interactivity down to the component leaf nodes.

## 5. Example Prompt Usage

**User Prompt**:
> "Create a new catalog view that lets users filter fabrics by color."

**AI Response Pattern**:
I will scaffold the following files to implement this feature following project conventions:

1. `apps/user/components/catalog/fabric-filter.tsx`
   - A client component (`"use client"`) utilizing `components/ui/select.tsx` to handle the dropdown state.
2. `apps/user/components/catalog/fabric-grid.tsx`
   - A presentational component that maps over the filtered fabric data using Tailwind grid classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
3. `apps/user/lib/fabric-types.ts` (if needed)
   - Interface definitions for the fabric data structure.

The parent `catalog.tsx` will hold the selected color state and pass it down to `fabric-filter.tsx`, which will call an `onColorChange` callback to update the grid.
