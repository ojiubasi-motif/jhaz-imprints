# UI Domain — Deep Dive

## Overview
Two frontend apps: Next.js 14 storefront (apps/web) and Vite+React admin dashboard (apps/admin). Both use Tailwind CSS and React Query.

## Next.js Storefront (apps/web)

### Server Components by Default
Pages are server components unless marked `"use client"`. The checkout wizard is client-side:

```tsx
"use client";
import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
```

### Multi-Step Wizard Pattern
```tsx
const STEPS = ["Body measurements", "Style choices", "Fabric & colour", "Review & pay"] as const;
const [currentStep, setCurrentStep] = useState(0);
```

### Draft Persistence
Form data auto-saves to localStorage via `methods.watch()`:

```tsx
useEffect(() => {
  const subscription = methods.watch((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });
  return () => subscription.unsubscribe();
}, [methods]);
```

## Vite Admin Dashboard (apps/admin)

### React Query Data Fetching
```tsx
const { data: orders = [], isLoading } = useQuery({
  queryKey: ["orders", "queue"],
  queryFn: () => fetchOrders(token),
  refetchInterval: 30000,
});
```

### ImageUploader — Drag & Drop with XHR Progress
Uses `react-dropzone` with XMLHttpRequest for progress:

```tsx
const { getRootProps, getInputProps } = useDropzone({
  onDrop,
  accept: { "image/jpeg": [".jpg"], "image/png": [".png"], "image/webp": [".webp"] },
  maxSize: 5 * 1024 * 1024,
});
```

### Skeleton Loading
```tsx
<div className="h-24 bg-gray-200 rounded animate-pulse" />
```

### Charts (Recharts)
```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data.monthlyRevenue}>
    <Bar dataKey="revenue" fill="#8B5A2B" />
  </BarChart>
</ResponsiveContainer>
```

## Shared Patterns
- Custom Tailwind classes: `card`, `input`, `btn-primary`, `btn-secondary`, `text-muted`, `text-error`
- Error alerts: `<div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">`
- Responsive grids: `grid grid-cols-1 gap-4 md:grid-cols-4`
