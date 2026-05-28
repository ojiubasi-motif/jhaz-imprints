# Tech Stack — Jhaz-imprints (`apps/bolt`)

## Core Technology Analysis

### Programming Language(s)
- **TypeScript** (`.ts`, `.tsx`) — strictly typed throughout; no plain JavaScript source files
- **CSS** via Tailwind utility classes within JSX

### Primary Framework
- **React 18.3** (with `StrictMode`) — functional components exclusively; no class components

### Secondary / Tertiary Frameworks & Libraries
- **React Router DOM v7** — client-side routing via `BrowserRouter` + `<Routes>` / `<Route>` in `main.tsx` / `App.tsx`
- **Tailwind CSS v3.4** — utility-first styling extended with a custom design system (color palettes, fonts, animations, keyframes)
- **Supabase JS v2** (`@supabase/supabase-js`) — BaaS for real-time database access (products table)
- **Lucide React v0.344** — icon library used universally across all components
- **Vite v5.4** — build tool / dev server (`vite.config.ts`)
- **PostCSS + Autoprefixer** — CSS preprocessing pipeline

### State Management Approach
- **Local React state & Global React Context** — `useState`, `useMemo`, `useCallback` from React core.
- **Global Cart Context** (`CartContext.tsx`) wraps the app to share shopping cart state globally (e.g. Navbar item count badge, Order wizard steps) and automatically syncs it to `localStorage` (`jhaz_cart`).
- No external state management libraries (no Redux, Zustand, Jotai, etc.)
- Shared data is either passed as props, declared as module-level constants, or accessed via global React Context.

### Other Relevant Technologies / Patterns
- **Intersection Observer API** — wrapped in a custom `useInView` hook for scroll-triggered animations
- **Environment Variables** — Supabase credentials via `import.meta.env.VITE_*` (Vite-style)
- **ESLint v9** with `typescript-eslint` and `eslint-plugin-react-hooks` for linting
- **Supabase Migrations** — SQL schema managed in `supabase/migrations/`

---

## Domain Specificity Analysis

### What Specific Problem Domain Does This Application Target?
**African fashion e-commerce with customization** — specifically an online storefront for handcrafted African clothing (Ankara, Kente, Adire, Dashiki, etc.) that emphasises made-to-order, personalised garments. The storefront targets the Nigerian market (pricing defaulted to Naira ₦, delivery states referencing Nigerian states, shipping defaulted to Nigeria).

### Core Business Concepts
- **Made-to-order / customisation** — every product is positionable as customisable; users choose fabric, measurements, and finishing details
- **African cultural heritage** — product taxonomy is rooted in African fabric types (Ankara, Kente, Adire, Batik, Aso-Oke, Brocade) and garment styles (Agbada, Kaftan, Iro & Buba, Dashiki, Boubou, Senator, Isiagu)
- **E-commerce product catalogue & Shopping Cart** — filtering by category, gender, occasion, fabric type; wishlist; shopping cart with item count badge; single-checkout delivery details; local Naira formatting helper.

### User Interactions Supported
- Browse a landing page with marketing sections (Hero, New Arrivals, Customize flow, Categories, Bestsellers, Testimonials, Heritage, Newsletter)
- Navigate to a full product catalogue with multi-faceted filtering and text search
- Toggle wishlist per product card
- Interact with a fabric selector preview on the Customize section
- Mobile-responsive navigation with an animated drawer

### Primary Data Types
- **`Product`** — id, name, slug, description, price, compare_at_price, category, fabric_type, image_url, is_customizable, rating, review_count, tag, gender, occasion, shipping_badge
- **`Filters`** — category[], gender[], occasion[], fabric_type[], search string
- Static display data declared as module-level arrays: testimonials, featured products, heritage facts, category tiles, fabric options
