# Style Guide: `hooks`

## What Makes This Project Unique

### 1. Two Primary Custom Hooks — `useInView` and `useCart`
The codebase relies on two primary custom hooks:
- `useInView` for scroll-triggered reveal animations.
- `useCart` for consuming the global shopping cart state and its modifier methods.
New hooks should be created only when a shared browser API or complex stateful pattern is needed across multiple pages or components.

### 2. Hook Returns a Ref + Derived State Tuple Object
The hook returns a named object `{ ref, isVisible }` — not an array:
```typescript
return { ref, isVisible };
// Usage:
const { ref, isVisible } = useInView();
```
Follow this named-return convention for any new hooks.

### 3. Ref Type Is Hardcoded to `HTMLDivElement`
```typescript
const ref = useRef<HTMLDivElement>(null);
```
The `ref` is always attached to a `div`. If a different element type is needed, create a new hook or make the generic type a parameter.

### 4. One-Shot Firing — Unobserve After First Intersection
```typescript
if (entry.isIntersecting) {
  setIsVisible(true);
  observer.unobserve(el);   // ← critical: fires once, then stops observing
}
```
This pattern means `isVisible` is a permanent latch — once `true`, it never returns to `false`. New hooks that need re-triggering should use a different approach.

### 5. Configurable Threshold With Sensible Default
```typescript
export function useInView(threshold = 0.15) {
```
The `0.15` (15% visibility) is the project default. Individual components can override: `useInView(0.3)`.

### 6. Cleanup Via Returning `observer.disconnect()`
```typescript
return () => observer.disconnect();
```
Not `observer.unobserve(el)` in the cleanup — `disconnect()` is used so the entire observer is torn down on unmount.

### 7. Global State Hook — `useCart`
To read and write the global shopping cart session (surviving route transitions and page refreshes), components must invoke `const { cart, addToCart, removeFromCart, clearCart } = useCart()`.
Never copy the global cart array into local component states.
