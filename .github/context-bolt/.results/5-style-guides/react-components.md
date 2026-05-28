# Style Guide: `react-components`

## What Makes This Project Unique

### 1. Section Components Are Always `<section>` Tags with an `id`
Every home-page section component returns a `<section>` element with an `id` matching the hash-link used in the navbar:
```tsx
<section id="new-arrivals" className="py-20 sm:py-28 bg-earth-50">
```
The `id` enables `/#new-arrivals` in-page anchor links from `<Link to="/#new-arrivals">`.

### 2. All Data Is Declared at Module Scope
Static content (testimonials, product tiles, nav links, fabric options) is declared as a typed `const` array **above** the component function — never inside it, never fetched from an API (unless it's `Catalog.tsx`):
```typescript
const fabrics = [
  { name: 'Ankara', color: 'bg-terra-500', desc: 'Bold wax prints' },
  ...
];
export default function Customize() { ... }
```

### 3. Scroll-Animation Pattern Is Mandatory for Section Components
Every section component that has a "content reveal" uses `useInView`:
```tsx
const { ref, isVisible } = useInView();
// ref → div.section-container
// isVisible → toggles 'animate-fade-up' vs 'opacity-0' on children
```
Without `useInView`, elements start invisible and never appear.

### 4. Section Header Is a 3-Line Pattern
Always: label span → h2 → body paragraph:
```tsx
<span className="text-terra-600 font-body text-sm font-semibold tracking-widest uppercase">
  Fresh Drops
</span>
<h2 className="heading-lg text-night-950 mt-2">New Arrivals</h2>
<p className="body-md mt-3 max-w-md">...</p>
```

### 5. Inline Sub-Components Defined In Same File
Small repetitive structures (card, badge, row item) are defined as named function declarations at the **bottom** of the file — not extracted into `components/`:
```typescript
function ProductCard({ product }: { product: Product }) { ... }
function FilterTag({ label, onRemove }: ...) { ... }
```
Only use a separate file if the component is reused across multiple pages.

### 6. `font-display` for Names/Prices, `font-body` for Labels/Buttons
- Product names, section headings, brand logo → `font-display`
- Labels, badges, buttons, nav text → `font-body`
- Never mix display/body on the same semantic element.

### 7. Pexels Images for Placeholder Product Photography
All example images use Pexels CDN URLs with `?auto=compress&cs=tinysrgb&w=600`:
```tsx
src="https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600"
```

### 8. Hover Actions Slide Up From Bottom
Product card hover actions appear by translating from below, not fading in:
```tsx
<div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
  <button className="w-full btn-primary text-xs py-3 rounded-lg">
    Customize & Order
  </button>
</div>
```

### 9. Lucide Icons Are Always Sized With the `size` Prop
Never use CSS to resize icons — use the `size` prop:
```tsx
<ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
```
