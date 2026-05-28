# Jhaz-imprints — AI Coding Assistant Instructions (`apps/bolt`)

## Purpose

This file enables AI coding assistants (e.g., GitHub Copilot, Claude, Gemini) to generate new features in `apps/bolt` that are **architecturally consistent** with the existing codebase. All patterns documented here are derived from direct analysis of the actual source files — not invented conventions.

Use this file as the primary reference whenever you are:
- Adding a new home-page section
- Creating a new page or wizard flow
- Adding a new hook or global state provider
- Fetching data from Supabase
- Styling any component or price displays
- Extending the navigation or footer links

---

## Tech Stack Summary

| Layer             | Technology                                      |
|-------------------|-------------------------------------------------|
| Language          | TypeScript (strict)                             |
| Framework         | React 18 (functional components only)           |
| Routing           | React Router DOM v7                             |
| Styling           | Tailwind CSS v3 with custom design tokens       |
| Data              | Supabase JS v2 (anon key, client-side)          |
| Icons             | Lucide React                                    |
| Build             | Vite v5                                         |
| State Management  | React built-ins & Global Cart Context (`CartContext.tsx`) with `localStorage` persistence |

**Domain:** African fashion e-commerce with made-to-order customisation, localized for the **Nigerian market** (prices in Naira ₦, shipping defaulted to Nigeria and Nigerian states).

---

## File Category Reference

### `react-components` — Section & Layout Components
**What it is:** Full-width, self-contained marketing blocks that compose the home page, or layout shells.

**Examples:** `src/components/Hero.tsx`, `src/components/Navbar.tsx`, `src/components/Customize.tsx`

**Key conventions:**
- Return a `<section id="...">` tag with a hash-link-compatible `id`
- Always use `useInView` for scroll-triggered reveal animations
- Declare all static data as module-level `const` arrays (before the component)
- Use the 3-line section header pattern: terra label → `heading-lg` h2 → `body-md` paragraph
- Product cards: `aspect-[3/4]`, `rounded-xl overflow-hidden`, hover action slides up from bottom
- All images use Pexels URLs with `?auto=compress&cs=tinysrgb&w=600`
- Lucide icons: always use `size={N}` prop

See: [5-style-guides/react-components.md](./.results/5-style-guides/react-components.md)

---

### `page-components` — Feature Pages & Wizards
**What it is:** Full pages with local state, global context integrations, data fetching, filtering, and complex step-wise wizard interactions.

**Examples:** `src/pages/Catalog.tsx`, `src/pages/Order.tsx`

**Key conventions:**
- TypeScript interfaces and constants declared at file top, before the export
- Fetch database-driven collections inside `useEffect` with local loading states
- All filtering is client-side via `useMemo` — never send filter params to Supabase
- `useCallback` wraps all event handlers passed into JSX
- Loading state: `animate-pulse` skeleton with `bg-earth-200` shapes
- Empty state: inline centered message, not a separate component
- Mobile drawer: conditional render of fixed overlay + side panel (z-40 backdrop, z-50 panel)
- Multi-step wizards (e.g. `Order.tsx`) synchronize current steps with URL search parameters (e.g. `?step=5`) so navigation is shareable and browser back/forward buttons function correctly.
- Inline sub-components (`StepCart`, `StepDelivery`, `FilterTag`, `ProductCard`) defined as named functions at the bottom of the page file.

See: [5-style-guides/page-components.md](./.results/5-style-guides/page-components.md)

---

### `state-providers` — Global Context State
**What it is:** React Context provider modules that share state across independent pages and nav shells.

**Examples:** `src/context/CartContext.tsx`

**Key conventions:**
- Export a wrapper provider component `<CartProvider>` and a hooks consumer `useCart()`
- Automatically synchronize and persist state in `localStorage` inside React effects
- Define and export interfaces representing state structures (e.g., `CartItem`, `Measurements`, `Personalization`) at the top of the provider file to act as the source of truth

---

### `hooks` — Custom React Hooks
**What it is:** Browser API wrappers providing reusable stateful logic.

**Examples:** `src/hooks/useInView.ts`

**Key conventions:**
- Return named object `{ ref, isVisible }` — not an array
- Ref type is `useRef<HTMLDivElement>(null)`
- One-shot IntersectionObserver: call `observer.unobserve(el)` after first fire
- Cleanup with `observer.disconnect()`
- Configurable with sensible default (e.g., `threshold = 0.15`)

See: [5-style-guides/hooks.md](./.results/5-style-guides/hooks.md)

---

### `lib-utilities` — Infrastructure & Formatting Helpers
**What it is:** Thin adapter modules for external services and shared functional helpers.

**Examples:** `src/lib/supabase.ts`, `src/lib/utils.ts`

**Key conventions:**
- Export a single initialized singleton (e.g. `supabase`) — never instantiate in components
- Credentials always from `import.meta.env.VITE_*`
- Shared formatting logic (like currency rendering via `formatNaira()` or raw pricing multiplier conversions using `convertPrice()`) must reside in `utils.ts` to ensure consistency
- Keep `lib/` for adapters and pure utility helpers only — no custom business workflows

See: [5-style-guides/lib-utilities.md](./.results/5-style-guides/lib-utilities.md)

---

### `styles` — Global CSS & Design System
**What it is:** `index.css` (Tailwind layers) and `tailwind.config.js` (design tokens).

**Key conventions:**
- **Colors:** Only use `terra-*`, `earth-*`, `night-*`, `kente-*`, `savanna-*` — never raw Tailwind colours
- **Typography:** `font-display` (Playfair Display) for headings/product names; `font-body` (Inter) for everything else
- **Layout:** Always wrap page content in `div.section-container`
- **Headings:** Always use `.heading-xl/lg/md/sm` classes
- **Buttons:** Always `.btn-primary`, `.btn-secondary`, or `.btn-ghost`
- **Cards:** Always `.card-hover` on interactive product cards
- **Images:** Always `.img-cover` on product/hero images
- **Animation delays:** Fixed delays → `.delay-*` classes; index-based → inline `style`

See: [5-style-guides/styles.md](./.results/5-style-guides/styles.md)

---

## Feature Scaffold Guide

### Adding a New Home-Page Section

1. Create `src/components/MySection.tsx`
2. Declare static data at module scope (if any)
3. Use the template:

```tsx
import { useInView } from '../hooks/useInView';

export default function MySection() {
  const { ref, isVisible } = useInView();

  return (
    <section id="my-section" className="py-20 sm:py-28 bg-earth-50">
      <div className="section-container" ref={ref}>
        {/* Section header */}
        <div className={isVisible ? 'animate-fade-up' : 'opacity-0'}>
          <span className="text-terra-600 font-body text-sm font-semibold tracking-widest uppercase">
            Label
          </span>
          <h2 className="heading-lg text-night-950 mt-2">Section Title</h2>
          <p className="body-md mt-3 max-w-md">Supporting description text.</p>
        </div>

        {/* Content */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={isVisible ? 'animate-fade-up' : 'opacity-0'}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              {/* card content */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

4. Import and add to `App.tsx` inside the `<Home>` function
5. Add a nav link in `Navbar.tsx`'s `navLinks` array: `{ label: 'Label', href: '/#my-section' }`

---

## Architectural Constraints (Do Not Violate)

| Rule | Detail |
|------|--------|
| ❌ No class components | All components must be functional |
| ❌ No local duplication of global state | All shopping cart data must reside in `CartContext.tsx` — do not duplicate it locally |
| ❌ No manual state step tracking in wizards | Wizard steps must sync directly with URL search parameters (e.g. `?step=5`) — do not maintain duplicate local step indicators |
| ❌ No raw Tailwind default colours | Only `terra/earth/night/kente/savanna` tokens |
| ❌ No hardcoded Naira formatting configuration | Currency and price conversions must utilize `formatNaira()` and `convertPrice()` helpers from `src/lib/utils.ts` |
| ❌ No separate file for inline sub-components | Keep `StepCart`, `StepDelivery`, `ProductCard`, `FilterTag`, etc. co-located within page files |
| ❌ No server-side filtering | All catalog filtering is client-side via `useMemo` |
| ❌ No re-instantiating supabase client | Always import from `../lib/supabase` |
| ❌ No animations without `useInView` | Sections that animate must use the hook |
| ✅ All routes declared in `App.tsx` | Do not scatter route definitions |
| ✅ All pages in `src/pages/` | Section components go in `src/components/` |
| ✅ Scroll resets on navigation | Wrap routes or include `ScrollToTop` helper in `App.tsx` to automatically scroll to top on routing |
| ✅ All navigation links updated in `Navbar.tsx` | Keep `navLinks` as the single source of truth |
