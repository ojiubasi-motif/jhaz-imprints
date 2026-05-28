# Tech Stack and Domain Analysis

## Core Technology Analysis

- **Programming language(s)**: TypeScript
- **Primary framework**: Next.js (App Router, v16.2.6), React (v19)
- **Any secondary or tertiary frameworks**: Tailwind CSS (v4.2.0), Shadcn UI (Radix UI primitives)
- **State management approach**: React Server Components, React Hooks (useState, Context), Form state managed by `react-hook-form` and `zod`.
- **Any other relevant technologies or patterns**: `lucide-react` for icons, `next-themes` for dark/light mode, `embla-carousel-react`, `recharts`, `vaul` (drawer).

## Domain Specificity Analysis

- **What specific problem domain does this application target?**: Premium Nigerian traditional tailoring and fashion e-commerce (Jhaz Imprints).
- **What are the core mathematical/business concepts?**: Product catalog browsing, custom tailoring measurements, multi-step order processing for bespoke clothing (fabric selection, style, measurements).
- **What type of user interactions does it support?**: E-commerce shopping workflows, browsing catalogs with filters, complex multi-step forms for submitting tailoring measurements and customization choices.
- **What are the primary data types and structures used?**: Product entries (fabrics, styles like Agbada, Ankara, Aso-oke), Order objects with detailed measurement properties, User personalization data.

## Application Boundaries

- **What features/functionality are clearly within scope based on existing code?**: Product catalog, landing page showcasing styles, multi-step order forms, UI components.
- **What types of features would be architecturally inconsistent with the current design?**: Traditional REST-heavy client-side SPAs (uses Next.js App Router server-first architecture), complex real-time collaboration (like WebSockets), or non-UI intense backend batch processing logic.
- **Are there any specialized libraries or mathematical concepts that suggest domain constraints?**: Heavy reliance on accessible UI components (Radix UI) and form validation (Zod) suggests a highly structured, accessible consumer-facing UI focus rather than low-level data processing.
