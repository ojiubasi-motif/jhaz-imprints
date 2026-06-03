# Domain Deep-Dive — All Architectural Domains

---

## Domain: `routing`

**Files examined:** `src/main.tsx`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/pages/Catalog.tsx`, `src/pages/Order.tsx`, `src/pages/Cart.tsx`

### Consistent Patterns
- `BrowserRouter` is the sole router; lives in `main.tsx`, wrapping `<App />`
- `App.tsx` owns the `<Routes>` tree: `/` renders the `<Home>` fragment, `/catalog` renders `<Catalog>`, `/order` renders `<Order>`, `/cart` renders `<Cart>`
- `ScrollToTop` component in `App.tsx` listens to route location changes **and search parameters** and resets scroll positions via `window.scrollTo(0, 0)` on page navigation
- `<Link>` is used for all internal navigation. External/static anchor links still use `<a href>` (e.g., footer social icons, contact info)
- Hash links like `/#new-arrivals` are plain string paths passed to `<Link to="...">` — React Router allows this pattern
- `useSearchParams` is the required pattern for reading filter parameters (`?category=...` in `Catalog.tsx` for category pre-filtering from home page), steps (`?step=...` in `Order.tsx` for wizard navigation), and product IDs (`?product=...` in `Order.tsx` for pre-selecting products)

### Conventions
- Route paths are lowercase kebab-case (e.g., `/catalog`, `/order`, `/cart`)
- Step routing in the tailoring wizard uses search parameters (e.g., `/order?step=5` to load the Shopping Cart, `/order?step=6` for Delivery) so that refreshing or sharing the URL preserves the user's current step
- Category pre-filtering from home page: `<Link to="/catalog?category=Dresses%20&%20Gowns">` automatically filters catalog on load
- Product navigation from cards: `<Link to="/order?product=${product.id}">` pre-selects product in Order wizard
- Cart persists across page navigation via `localStorage` (`jhaz_cart` key); synchronized via `jhaz-cart-updated` custom event
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

#### Page Components (Catalog, Order, Cart)
- More complex — includes local state, data fetching, filtering logic, and context hooks
- Inline sub-components defined as functions or arrow functions inside or below the main export:
  - `FilterSection` — a reusable inner arrow function with TypeScript props interface
  - `FilterSidebar` — an arrow function wrapping `FilterSection` calls
  - `FilterTag` / `ProductCard` — standalone functions at bottom of `Catalog.tsx`
  - `StepCart` / `StepDelivery` / `StepOrderSummary` / `StepPayment` / `StepConfirmation` — standalone step components defined at the bottom of `Order.tsx` complying with the co-location constraint
  - `Cart.tsx` — standalone cart display page, mirrors constants from `Order.tsx` to maintain data consistency (same `OUTFIT_STYLES`, `FABRIC_PRESETS`, `CUSTOMIZATION_PRICES`, color system)
- Interfaces (`Product`, `Filters`, `CartItem`, `OrderData`, `Measurements`, `Personalization`, `DeliveryDetails`) declared at top of file before the component
- Constants (`FILTER_OPTIONS`, `INITIAL_FILTERS`, `OUTFIT_STYLES`, `FABRIC_PRESETS`, `DELIVERY_PRICES`, `CUSTOMIZATION_PRICES`, `NIGERIAN_STATES`, `SUPPORTED_COUNTRIES`) declared as module-level `const` objects
- **localStorage Integration**: `Order.tsx`, `Cart.tsx`, and `Navbar.tsx` all synchronize cart state via `jhaz_cart` key and `jhaz-cart-updated` custom event to keep UI in sync

#### Naming Conventions
- Component files: `PascalCase.tsx`
- Component functions: PascalCase matching the filename
- Props interfaces: `{ComponentName}Props` pattern OR inline in the function signature
- Module-level data: `SCREAMING_SNAKE_CASE` for constants, `camelCase` for arrays

---

## Domain: `styling`

**Files examined:** `src/index.css`, `tailwind.config.js`, all `src/components/*.tsx`, `src/pages/Catalog.tsx`, `src/pages/Order.tsx`, `src/pages/Cart.tsx`

### Design Token System (from `tailwind.config.js`)

| Token     | Usage                                  |
|-----------|----------------------------------------|
| `terra`   | Primary brand color (burnt orange/rust) — CTAs, accents, hover states, embroidery pills |
| `earth`   | Background, borders, muted text, input fields |
| `night`   | Dark surfaces, text (near-black), headers |
| `kente`   | Gold accent — gradient text, secondary highlights, cart totals, checkout buttons |
| `savanna` | Success/badge green — accessories and success states |

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

---

## Domain: `localization`

**Files examined:** `src/pages/Order.tsx`, `src/lib/`, `src/pages/Cart.tsx`, all price display locations

### Nigeria Market Defaults

#### Currency & Formatting
```typescript
// Use throughout for all price displays
function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}
// Example: 45000 → "₦45,000"
```

#### Supported Countries & States
```typescript
export const SUPPORTED_COUNTRIES = ['Nigeria'] as const;
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];
```

#### Pricing Schema (All in Naira)
- **Outfit Base Prices**: ₦45,000 - ₦120,000 per style
- **Fabric Upgrades**: ₦0 - ₦25,000 (includes embroidery color adjustments)
- **Customization Fees**:
  - Embroidery: ₦0 (none) → ₦5,000 (minimal) → ₦12,000 (moderate) → ₦25,000 (elaborate)
  - Lining: ₦8,000
  - Accessories: ₦3,000 each (belt, shoes, headwrap)
- **Delivery Prices**: Standard ₦3,500 (14-21 days) | Express ₦7,500 (7-10 days)
- **Promo Code**: `JHAZ10` applies 10% discount to order total

#### Contact & Communication
- Phone format placeholder: `"+234 XXX XXX XXXX"` (Nigerian international dialing code +234)
- All delivery notes reference Nigerian postal/logistics system

### Implementation Locations
- `DeliveryDetails` interface in `Order.tsx` includes `country: string` field
- `StepDelivery` component (Step 6) includes country dropdown with "Nigeria" pre-selected
- All `Product`, `CartItem`, `OrderData` price fields assumed to be in Naira
- `Order.tsx` and `Cart.tsx` use `formatNaira()` for all displayed prices
- `NewArrivals.tsx`, `Bestsellers.tsx`, `Catalog.tsx` display prices with `₦` symbol and `.toLocaleString('en-NG')`

### Cart Persistence Pattern (localStorage sync)
- Key: `jhaz_cart`
- Triggered: Every time items change in Order wizard (Step 5) or Cart page
- Sync Event: Custom `jhaz-cart-updated` event dispatched from `Order.tsx`, listened by `Navbar.tsx` for badge refresh
- Format: `CartItem[]` array (includes product id, customization details, price)
- Recovery: On app load, `Order.tsx` and `Cart.tsx` read from localStorage if available

---

## Domain: `auth`

**Files examined:** `src/store/index.ts`, `src/store/hooks.ts`, `src/store/slices/authSlice.ts`, `src/lib/apiClient.ts`, `src/lib/tokenStore.ts`, `src/components/AuthInitializer.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/App.tsx`

### Dual-Token Security Pattern
The app uses a **dual-token** strategy:
- **Access token** — short-lived JWT stored in memory only (`tokenStore`). Never written to `localStorage` or cookies.
- **Refresh token** — long-lived token stored in an httpOnly cookie set by the API server. Sent automatically with `credentials: 'include'` on every fetch.

This combination means XSS attacks cannot steal the refresh token, and the access token is never persisted.

### Redux Store Structure
```typescript
// src/store/index.ts
export const store = configureStore({
  reducer: { auth: authReducer },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// src/store/hooks.ts — always use these typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Auth State Shape
```typescript
interface AuthState {
  user: User | null;      // null = unauthenticated
  isLoading: boolean;     // true during any async thunk
  error: string | null;   // API error message from rejected thunk
  expiresAt: number | null; // access token expiry (ms epoch)
}
```

### Async Thunks
| Thunk | Purpose |
|-------|---------|
| `loginUser(LoginData)` | POST `/auth/login`, stores access token in `tokenStore`, returns `{ user, expiresAt }` |
| `registerUser(RegisterData)` | POST `/auth/register`, same token storage pattern |
| `loadProfile()` | GET `/auth/me` via `fetchApi()` (auto-refresh); used for silent restore on mount |
| `logoutUser()` | POST `/auth/logout`, clears `tokenStore`, clears Redux state |

### `tokenStore` Contract
```typescript
// src/lib/tokenStore.ts — module-level singleton, not exported as a class
tokenStore.getToken(): string | null
tokenStore.setToken(token: string | null): void
tokenStore.clear(): void
tokenStore.hasToken(): boolean
tokenStore.shouldRefresh(): boolean   // true if < 60s until expiry
tokenStore.getExpiryTime(): number | null  // ms epoch
```

### `fetchApi` Contract
```typescript
// src/lib/apiClient.ts
export async function fetchApi(endpoint: string, options?: RequestInit): Promise<any>
// - Calls ensureToken() before every request (proactive refresh if < 60s until expiry)
// - Attaches Authorization: Bearer <token>
// - Includes credentials: 'include' (sends refresh cookie)
// - On 401: clears token + dispatches 'auth-expired' window event
// - Unwraps { data: ... } envelope automatically
```

### AuthInitializer Pattern
```tsx
// src/components/AuthInitializer.tsx — wraps all app content in App.tsx
// On mount: dispatch(loadProfile()) — silent restore via refresh cookie
// Watches expiresAt changes: schedules proactive token refresh 60s before expiry
// Listens for 'auth-expired' events: dispatch(clearAuth())
export default function AuthInitializer({ children }: { children: React.ReactNode })
```

### App.tsx Provider Hierarchy
```tsx
<Provider store={store}>           {/* Redux — outermost */}
  <AuthInitializer>               {/* Silent session restore */}
    <div className="font-body ...">
      <ScrollToTop />
      <Navbar />
      <Routes> ... </Routes>
      <Footer />
    </div>
  </AuthInitializer>
</Provider>
```

### Login / Register Page Patterns
Both `Login.tsx` and `Register.tsx` follow the same pattern:
1. Read auth state: `const { isLoading, error, user } = useAppSelector((state) => state.auth)`
2. Redirect immediately if already logged in: `useEffect(() => { if (user) navigate(redirect); }, [user])`
3. Read redirect target from URL: `const redirect = searchParams.get('redirect') || '/'`
4. On submit: `dispatch(loginUser({ email, password }))` then navigate on success
5. Use `dispatch(clearError())` on mount and before submit
6. Apply `useInView()` for card entrance animation (same as all page components)
7. Form validation is local — errors stored in `useState<Record<string, string>>({})`

### Routing Conventions (auth)
- Unauthenticated users navigating to protected content should be redirected to `/login?redirect=/original-path`
- After successful login/register, navigate to `searchParams.get('redirect') || '/'`
- Link between login and register preserves redirect: `to={\`/register?redirect=${encodeURIComponent(redirect)}\`}`
