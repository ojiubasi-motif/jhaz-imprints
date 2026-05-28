# Style Guide: `styles`

## What Makes This Project Unique

### 1. Three-Layer Tailwind Architecture
`index.css` is structured in exactly three `@layer` blocks:
```css
@tailwind base;      /* → @layer base: resets, body defaults */
@tailwind components; /* → @layer components: reusable named utilities */
@tailwind utilities; /* → @layer utilities: animation delays, scrollbar hide */
```
Never add component styles to `@layer utilities` or vice versa.

### 2. All Reusable Patterns Are Named Classes in `@layer components`
Rather than repeating long Tailwind strings, this project abstracts repeating patterns into named classes:
- `.section-container` — always use for max-width content centering
- `.heading-xl/lg/md/sm` — always use for headings (never raw `text-5xl font-bold` alone)
- `.btn-primary/secondary/ghost` — always use for buttons
- `.card-hover` — always use for interactive cards
- `.img-cover` — always use on product/hero images

### 3. Custom Color System Replaces Default Tailwind Colors
The project extends (does not override) Tailwind's colors. The design system uses **only** the custom palettes:
- `terra-*` (burnt orange) — primary brand, CTAs
- `earth-*` (warm beige/brown) — backgrounds, borders, muted text
- `night-*` (near-black neutral) — text, dark surfaces
- `kente-*` (gold/yellow) — accent highlights, gradient stops
- `savanna-*` (green) — success states, badges

**Never** use default Tailwind colours like `red-500`, `blue-600` directly in component classes.

### 4. Animation Delays Are Utility Classes, Not Inline Styles (for Fixed Delays)
Fixed delays use the `.delay-*` utility classes:
```tsx
<div className="animate-fade-up delay-300" />
```
Dynamic delays (based on array index) use inline `style`:
```tsx
style={{ animationDelay: `${(i + 1) * 100}ms` }}
```

### 5. `::selection` Styling Matches the Brand
```css
::selection {
  background-color: #edab72;  /* terra-300 */
  color: #2e231c;             /* earth-950 */
}
```
This reinforces brand identity even in text selection.

### 6. Font Smoothing Is Applied Globally
```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```
Ensures consistent rendering across platforms.
