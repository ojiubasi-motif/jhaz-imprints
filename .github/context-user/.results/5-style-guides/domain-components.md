# domain-components Style Guide

Unique conventions for domain-specific components in this project:

- **Colocation by Feature**: Domain components are grouped into feature folders like `components/order/` and `components/catalog/`, separating them from generic sections like the landing page.
- **State Delegation**: Complex state is hoisted to a centralized "Flow" or "Catalog" parent component, which then delegates slices of state and update functions down to "Step" or "Card" components via props.
- **Tailwind JIT Values**: Specific brand colors are sometimes hardcoded using Tailwind's arbitrary value syntax (e.g., `bg-[#1B4332]`, `bg-[#FDF6EC]`) for backgrounds, while typography relies heavily on specific font families (`font-[family-name:var(--font-playfair)]`).

Example:
```tsx
export function DeliveryStep({ delivery, onUpdateDelivery, onNext, onBack }: DeliveryStepProps) {
  // ...
  return (
     <div className="bg-white rounded-xl shadow-sm border border-[#1B4332]/10 p-6 sm:p-8">
        {/* ... */}
     </div>
  )
}
```
