# Style Guide: React Components

## Unique Conventions
- Components are default exports for page-level components, named exports for reusable components
- Client components use `"use client"` directive at file top
- Props interfaces defined inline or as exported interfaces (e.g., `MeasurementWizardProps`)
- Form components use `useForm` with `zodResolver` and `FormProvider` for multi-step forms
- `useFieldArray` for dynamic form sections (e.g., fabric/style options)
- Data fetching uses `useQuery`/`useMutation` from `@tanstack/react-query`
- Auth token read from `localStorage.getItem("auth_token")` inside component body
- Loading states use skeleton placeholders with `animate-pulse`
- Error states use `role="alert"` div with `bg-red-50 text-red-700`
- Tailwind utility classes for all styling — no CSS modules, no styled-components
- `ImageUploader` uses `react-dropzone` and XHR for upload progress
- File components organized: `components/` for reusable, `pages/` for route-level, `components/checkout/steps/` for wizard steps
