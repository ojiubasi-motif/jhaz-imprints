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
- **Redux Toolkit v2** (`@reduxjs/toolkit`) + **React Redux** — used exclusively for authentication state (`authSlice`)
- **Lucide React v0.344** — icon library used universally across all components
- **Vite v5.4** — build tool / dev server (`vite.config.ts`) with a dev proxy (`/api` → `http://localhost:8080`)
- **PostCSS + Autoprefixer** — CSS preprocessing pipeline

### State Management Approach
- **Local React state & Global React Context** — `useState`, `useMemo`, `useCallback` from React core.
- **localStorage Integration** — Shopping cart items persisted in `localStorage` (key: `jhaz_cart`); synchronized across pages via custom `jhaz-cart-updated` event; decoupled from Context (allows direct localStorage reads in multiple pages)
- **Order Wizard State** — Managed locally within `Order.tsx` component; multi-item cart stored in state and synchronized to localStorage; wizard steps accessible via URL search params (`?step=N`)
- **Redux Toolkit (auth only)** — `@reduxjs/toolkit` used for authentication global state (`src/store/slices/authSlice.ts`). The store is configured in `src/store/index.ts` and provided via `<Provider>` in `App.tsx`. Typed dispatch and selector hooks (`useAppDispatch`, `useAppSelector`) are exported from `src/store/hooks.ts`.
- **In-Memory Token Store** — Access tokens are stored in a module-level variable in `src/lib/tokenStore.ts` (never in `localStorage`). The refresh token lives in an httpOnly cookie managed by the server.
- Shared data is either passed as props, declared as module-level constants, accessed via localStorage and custom events, or (for auth) managed in Redux.

### Other Relevant Technologies / Patterns
- **Intersection Observer API** — wrapped in a custom `useInView` hook for scroll-triggered animations
- **Environment Variables** — Supabase credentials via `import.meta.env.VITE_*` (Vite-style); `VITE_API_URL` for gateway (defaults to `/api` via Vite proxy in dev)
- **Vite Dev Proxy** — All `/api/*` requests are proxied to `http://localhost:8080` in development (`vite.config.ts`). This ensures cookies set by the API are same-origin with the Vite dev server.
- **REST API Layer** — `src/lib/apiClient.ts` provides a `fetchApi()` wrapper that automatically attaches Bearer tokens, proactively refreshes tokens before expiry, and handles `auth-expired` events on 401 responses.
- **ESLint v9** with `typescript-eslint` and `eslint-plugin-react-hooks` for linting
- **Supabase Migrations** — SQL schema managed in `supabase/migrations/`

---

## Domain Specificity Analysis

### What Specific Problem Domain Does This Application Target?
**African fashion e-commerce with customization** — specifically an online storefront for handcrafted African clothing (Ankara, Kente, Adire, Dashiki, etc.) that emphasises made-to-order, personalised garments. The storefront targets the Nigerian market (pricing defaulted to Naira ₦, delivery states referencing Nigerian states, shipping defaulted to Nigeria).

### Core Business Concepts
- **Made-to-order / customisation** — every product is positionable as customisable; users choose fabric, measurements, and finishing details
- **African cultural heritage** — product taxonomy is rooted in African fabric types (Ankara, Kente, Adire, Batik, Aso-Oke, Brocade) and garment styles (Agbada, Kaftan, Iro & Buba, Dashiki, Boubou, Senator, Isiagu)
- **Nigeria-first market** — all pricing in Naira (₦); delivery defaulted to Nigerian states; Nigerian phone format (+234 XXX XXX XXXX)
- **E-commerce product catalogue & Shopping Cart** — filtering by category, gender, occasion, fabric type; wishlist; shopping cart with multi-item support and persistent storage; checkout flow with delivery details; Naira currency formatting throughout
- **Multi-step Order Customization Wizard** — 9-step wizard allowing users to customize outfits (Style → Fabric → Measurements → Personalization → Cart → Delivery → Summary → Payment → Confirmation); cart persists across steps and sessions

### User Interactions Supported
- Browse a landing page with marketing sections (Hero, New Arrivals, Customize flow, Categories, Bestsellers, Testimonials, Heritage, Newsletter)
- Click category tiles to pre-filter the catalog (e.g., "Dresses & Gowns" navigates to `/catalog?category=...` with filters auto-applied)
- Navigate to a full product catalogue with multi-faceted filtering and text search
- Click "Customize & Order" on any product card to enter the order wizard with that product pre-selected
- Toggle wishlist per product card
- Interact with a fabric selector preview on the Customize section
- Multi-step order customization: Style → Fabric → Measurements → Personalization → Cart → Delivery → Summary → Payment → Confirmation
- Add multiple customized outfits to cart; view cart with price breakdown; proceed to checkout from cart
- **Register and log in** — `/register` and `/login` pages with JWT-based authentication via the REST API gateway; silent session restore on page refresh using the httpOnly refresh token cookie
- Mobile-responsive navigation with an animated drawer
- Automatic page scroll-to-top on all route and parameter changes for clean navigation experience

### Primary Data Types
- **`Product`** — id, name, slug, description, price, compare_at_price, category, fabric_type, image_url, is_customizable, rating, review_count, tag, gender, occasion, shipping_badge
- **`Filters`** — category[], gender[], occasion[], fabric_type[], search string
- Static display data declared as module-level arrays: testimonials, featured products, heritage facts, category tiles, fabric options
