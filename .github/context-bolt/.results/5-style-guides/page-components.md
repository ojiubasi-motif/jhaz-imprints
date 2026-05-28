# Style Guide: `page-components`

## What Makes This Project Unique

### 1. Pages Fetch Data via Supabase — Never Accept It as Props
`Catalog.tsx` manages all data fetching internally. Pages are never passed product/catalogue data as props from a parent route — they own their own data pipeline:
```typescript
const [products, setProducts] = useState<Product[]>([]);
useEffect(() => { fetchProducts(); }, []);
async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order(...);
}
```

### 2. All Filtering Is Client-Side With `useMemo`
No filter params are sent to Supabase. The full product list is fetched once; `useMemo` computes `filteredProducts` from the local state:
```typescript
const filteredProducts = useMemo(() => {
  return products.filter((p) => { ... });
}, [products, filters]);
```

### 3. TypeScript Interfaces and Constants Declared at File Top
Page files open with their interface definitions and module-level constants **before** the component export:
```typescript
interface Product { ... }
interface Filters { ... }
const FILTER_OPTIONS = { ... };
const INITIAL_FILTERS: Filters = { ... };
export default function Catalog() { ... }
```

### 4. `useCallback` Wraps All Event Handler Functions
All state-mutation handlers that are used in JSX callbacks are wrapped with `useCallback`:
```typescript
const toggleFilter = useCallback((key: keyof Filters, value: string) => { ... }, []);
const clearFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);
```

### 5. Skeleton Loading State Uses `animate-pulse` With Earth Tones
The loading skeleton uses `animate-pulse` with `bg-earth-200` on placeholder divs — not a spinner:
```tsx
{loading && (
  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[3/4] bg-earth-200 rounded-xl" />
        <div className="mt-4 h-4 bg-earth-200 rounded w-3/4" />
      </div>
    ))}
  </div>
)}
```

### 6. Empty State Is Inline, Not a Separate Component
```tsx
{filteredProducts.length === 0 && (
  <div className="text-center py-20">
    <p className="font-display text-2xl font-semibold text-night-950 mb-2">No pieces found</p>
    <p className="text-earth-500 mb-6">Try adjusting your filters or search terms.</p>
    <button onClick={clearFilters} className="btn-secondary text-sm">Clear All Filters</button>
  </div>
)}
```

### 7. Mobile Drawer Uses Portal-Style Fixed Positioning
The mobile filter drawer is a conditional render of a fixed overlay + panel, not a separate modal component or portal:
```tsx
{mobileFiltersOpen && (
  <>
    <div className="fixed inset-0 z-40 bg-night-950/50 backdrop-blur-sm lg:hidden" onClick={...} />
    <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-earth-50 shadow-2xl lg:hidden overflow-y-auto">
      ...
    </div>
  </>
)}
```

### 8. Step Wizards Synced to Search Parameters
Multi-step forms (like the customizer flow in `Order.tsx`) synchronize the active step step-indicator state with the URL search parameters using `useSearchParams`. The active step state is derived directly from the URL (e.g., `/order?step=5`), ensuring that refreshing the page, using browser back/forward buttons, or deep-linking to the cart functions reliably.
