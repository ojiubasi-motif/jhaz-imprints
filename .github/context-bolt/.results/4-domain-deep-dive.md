# Domain Deep-Dive — All Architectural Domains

---

## Domain: `routing`

**Files examined:** `src/main.tsx`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/pages/Catalog.tsx`, `src/pages/Order.tsx`

### Consistent Patterns
- `BrowserRouter` is the sole router; lives in `main.tsx`, wrapping `<App />`
- `App.tsx` owns the `<Routes>` tree: `/` renders the `<Home>` fragment, `/catalog` renders `<Catalog>`, `/order` renders `<Order>`
- `ScrollToTop` component in `App.tsx` listens to route location changes and resets scroll positions via `window.scrollTo(0, 0)` on page navigation
- `<Link>` is used for all internal navigation. External/static anchor links still use `<a href>` (e.g., footer social icons, contact info)
- Hash links like `/#new-arrivals` are plain string paths passed to `<Link to="...">` — React Router allows this pattern
- `useSearchParams` is the required pattern for reading filter parameters (`?category=...` in `Catalog.tsx`) and steps (`?step=...` in `Order.tsx`) to enable bookmarks and clean navigation flows

### Conventions
- Route paths are lowercase kebab-case (e.g., `/catalog`, `/order`)
- Step routing in the tailoring wizard uses search parameters (e.g., `/order?step=5` to load the Shopping Cart) so that refreshing or sharing the URL preserves the user's current step
- New pages: create in `src/pages/`, import into `App.tsx`, add `<Route>` there

---

## Domain: `ui`

**Files examined:** All `src/components/*.tsx`, `src/pages/Catalog.tsx`, `src/pages/Order.tsx`, `src/App.tsx`

### Consistent Patterns

#### Section Components (Home page blocks)
Each follows a highly consistent structure:
1. Import `useInView` if animation is required
2. Declare static data arrays at module scope (typed with inline interfaces or simple objects)
3. Export one default functional component
4. Component returns a `<section>` with `id` attribute matching the hash-link (e.g., `id="new-arrivals"`, `id="customize"`)
5. Contains a `div.section-container` wrapper (sometimes `ref={ref}`)
6. Section header pattern: `<span>` label in `text-terra-600 tracking-widest uppercase` → `<h2 className="heading-lg">` → `<p className="body-md">`
7. Grid/card layouts use Tailwind grid utilities with responsive breakpoints

#### Page Components (Catalog, Order)
- More complex — includes local state, data fetching, filtering logic, and context hooks
- Inline sub-components defined as functions or arrow functions inside or below the main export:
  - `FilterSection` — a reusable inner arrow function with TypeScript props interface
  - `FilterSidebar` — an arrow function wrapping `FilterSection` calls
  - `FilterTag` / `ProductCard` — standalone functions at bottom of `Catalog.tsx`
  - `StepCart` / `StepDelivery` / `StepOrderSummary` / `StepPayment` / `StepConfirmation` — standalone step components defined at the bottom of `Order.tsx` complying with the co-location constraint
- Interfaces (`Product`, `Filters`, `CartItem`, `OrderData`) declared at top of file before the component
- Constants (`FILTER_OPTIONS`, `INITIAL_FILTERS`, `OUTFIT_STYLES`, `FABRIC_PRESETS`, `DELIVERY_PRICES`, `CUSTOMIZATION_PRICES`) declared as module-level `const` objects

#### Naming Conventions
- Component files: `PascalCase.tsx`
- Component functions: PascalCase matching the filename
- Props interfaces: `{ComponentName}Props` pattern OR inline in the function signature
- Module-level data: `SCREAMING_SNAKE_CASE` for constants, `camelCase` for arrays

---

## Domain: `styling`

**Files examined:** `src/index.css`, `tailwind.config.js`, all `src/components/*.tsx`, `src/pages/Catalog.tsx`

### Design Token System (from `tailwind.config.js`)

| Token     | Usage                                  |
|-----------|----------------------------------------|
| `terra`   | Primary brand color (burnt orange/rust) — CTAs, accents, hover states |
| `earth`   | Background, borders, muted text       |
| `night`   | Dark surfaces, text (near-black)       |
| `kente`   | Gold accent — gradient text, secondary highlights |
| `savanna` | Success/badge green                    |

### Typography System
- `font-display` (Playfair Display, serif) — product names, headings, price figures, brand name
- `font-body` (Inter, sans-serif) — body text, labels, navigation, buttons
- Heading classes are always one of: `heading-xl`, `heading-lg`, `heading-md`, `heading-sm`
- Subheading label above section titles: `text-terra-600 font-body text-sm font-semibold tracking-widest uppercase`

### Component Utility Classes (from `@layer components`)

| Class              | Purpose                                       |
|--------------------|-----------------------------------------------|
| `.section-container` | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` — ALL page-width content lives in this |
| `.heading-xl/lg/md/sm` | Responsive heading sizes with `font-display` |
| `.body-lg / .body-md` | Body text with earth-toned colors            |
| `.btn-primary`     | Dark fill button with terra hover             |
| `.btn-secondary`   | Bordered button                               |
| `.btn-ghost`       | Underline-only link-style button              |
| `.card-hover`      | `hover:shadow-xl hover:-translate-y-1`        |
| `.img-cover`       | `w-full h-full object-cover`                  |
| `.pattern-overlay` | Background radial gradient for hero sections  |
| `.text-gradient`   | Terra→kente gradient text                     |
| `.scrollbar-hide`  | Hide scrollbar                                |

### Animation Conventions
- One-shot scroll animations triggered via `useInView`: `animate-fade-up`, `animate-slide-in-left`, `animate-slide-in-right`, `animate-scale-in`
- Persistent animations: `animate-float` (decorative blobs), `animate-marquee` (text strip)
- Stagger pattern: `style={{ animationDelay: \`${i * 100}ms\` }}` inside `.map()` loops
- `delay-*` utility classes (`delay-100` through `delay-700`) for fixed delays

---

## Domain: `data-layer`

**Files examined:** `src/lib/supabase.ts`, `src/pages/Catalog.tsx`, `supabase/migrations/*.sql`, `.env`

### Supabase Client
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Data Fetching Pattern (Catalog.tsx)
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchProducts();
}, []);

async function fetchProducts() {
  setLoading(true);
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('is_featured', { ascending: false });
  if (!error && data) setProducts(data as Product[]);
  setLoading(false);
}
```

### Client-Side Filtering
```typescript
const filteredProducts = useMemo(() => {
  return products.filter((p) => {
    // Each active filter dimension checked with .includes()
    // Text search: name || description || category || fabric_type
  });
}, [products, filters]);
```

### Database Schema (from migrations)
- **`products`** table with: id, name, slug, description, price, compare_at_price, category, fabric_type, image_url, is_customizable, is_featured, rating, review_count, tag, gender, occasion, shipping_badge
- **`customizations`** table referenced in migrations (for order customisation data)
- Added `gender`, `occasion`, `shipping_badge` in second migration

---

## Domain: `animations`

**Files examined:** `src/hooks/useInView.ts`, all `src/components/*.tsx`, `tailwind.config.js`

### `useInView` Hook Contract
```typescript
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  // IntersectionObserver fires once, then unobserves
  return { ref, isVisible };
}
```

### Usage Template in Section Components
```tsx
const { ref, isVisible } = useInView();
return (
  <section>
    <div className="section-container" ref={ref}>
      <div className={isVisible ? 'animate-fade-up' : 'opacity-0'}>
        {/* header */}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          className={isVisible ? 'animate-fade-up' : 'opacity-0'}
          style={{ animationDelay: `${(i + 1) * 100}ms` }}
        />
      ))}
    </div>
  </section>
);
```

### Animation Token Summary
| Animation        | Duration | Use                                    |
|------------------|----------|----------------------------------------|
| `fade-up`        | 0.8s     | General section entry (most common)    |
| `fade-in`        | 0.6s     | Simple opacity entrance                |
| `slide-in-left`  | 0.8s     | Left-side content (Customize section)  |
| `slide-in-right` | 0.8s     | Right-side image/preview               |
| `scale-in`       | 0.6s     | Card or element scale pop-in           |
| `float`          | 6s ∞     | Background decorative blobs            |
| `marquee`        | 30s ∞    | Continuous text ticker                 |

---

## Domain: `navigation`

**Files examined:** `src/components/Navbar.tsx`, `src/App.tsx`, `src/components/Footer.tsx`

### Navbar State Pattern
```typescript
const { cart } = useCart();                         // global cart context
const [isOpen, setIsOpen] = useState(false);        // mobile menu
const [scrolled, setScrolled] = useState(false);    // transparent-to-opaque
const location = useLocation();
const isHome = location.pathname === '/';
```

### Scroll Listener Pattern
```typescript
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

### Link Data Shape
```typescript
const navLinks = [
  { label: string, href: string }   // for Navbar
  // or
  { label: string, to: string }     // for Footer <Link> items
  // or
  { label: string, href: string }   // for Footer <a> items
];
```

### Cart Icon Badge Convention
- The Navbar render block displays a dynamic badge on the ShoppingBag icon only if `cart.length > 0`
- The ShoppingBag icon link routes directly to `/order?step=5` to open the wizard's cart view

---

## Domain: `state-management`

**Files examined:** `src/context/CartContext.tsx`, `src/App.tsx`, `src/pages/Order.tsx`, `src/components/Navbar.tsx`

### CartContext Hook & Provider Contract
```typescript
// src/context/CartContext.tsx
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('jhaz_cart');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem('jhaz_cart', JSON.stringify(cart));
  }, [cart]);
  
  // exposed methods: addToCart, removeFromCart, updateCartItem, clearCart
};
export const useCart = () => useContext(CartContext);
```

### Context Registration
- `<CartProvider>` wraps the route containers inside `<App />` so both layout shells and router page targets have equal access to the state via the custom `useCart()` hook.
- Persistent operations must be handled implicitly within context effects (e.g. JSON stringifying to `localStorage`).
