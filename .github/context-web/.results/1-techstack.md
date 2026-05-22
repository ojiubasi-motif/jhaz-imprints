# Tech Stack & Domain Analysis - apps/web

## Core Technology Analysis

- **Programming Language**: TypeScript
- **Primary Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Auth Persistence**: `tokenStore` (in-memory state with proactive silent refresh middleware)
- **Form Management**: React Hook Form with Zod validation
- **API Communication**: Unified `apiClient.ts` wrapper ensuring `credentials: 'include'` for cross-origin proxy requests.
- **External Integrations**: Paystack (payment processing via `@paystack/inline-js` and dynamic inline script).
- **Error Handling**: React Error Boundaries (flow-specific) and centralized Zod validation.

## Domain Specificity Analysis

- **Problem Domain**: E-commerce Storefront (B2C)
- **Core Business Concepts**:
    - Product Catalog management and display
    - User Authentication and Session management
    - Shopping Cart and Checkout workflows (supporting custom measurements)
    - Order tracking and History (with data augmentation from MongoDB)
    - Payment integration via Paystack (Online/Offline flows)
- **User Interactions**:
    - Browsing products and categories
    - Adding items to cart
    - Managing user profile and addresses
    - **Offline-Ready Checkout**: Secure checkout process with defensive React Hook Form drafting and "Pay Later" fallback for offline users.
    - Viewing order status (with real-time verification UI)
- **Primary Data Types**:
    - Products: metadata, pricing, inventory
    - Users: credentials, profiles
    - Orders: items, totals, status
    - Payments: transaction details, Paystack references

## Application Boundaries

- **In-Scope**:
    - Product listing and detail pages
    - Authentication flow (login, register)
    - **Payment Orchestration**: Handling Paystack inline modal, webhooks, and manual verification fallbacks.
    - **Offline Resilience**: Detecting network status and enabling deferred payment creation.
    - Order management and history display.
    - **Token Lifecycle Management**: Proactive refresh strategy for access tokens to minimize `401` latency in high-traffic checkout flows.
    - Robust Auth Persistence (initializing state as `isLoading: true` to prevent premature UI redirection on hard refresh).
- **Architectural Patterns**:
    - **Defensive Hydration**: Ensuring form drafts don't overwrite critical URL parameters (like `productId`).
    - **Checkout Error Boundaries**: Isolating checkout failures to prevent full-app crashes.
    - **Proactive Token Refresh**: `AuthInitializer` in `Providers.tsx` schedules a refresh 60 seconds before `expiresAt`. The `apiClient` uses a deduplication lock (`_refreshing` promise) to prevent concurrent refresh storms.
    - **Pending Payment Resume**: `Providers.tsx` listens for `window.online` events and shows a modal to resume incomplete payments when connectivity is restored.
- **Architectural Inconsistencies**:
    - Introducing a different state management library (e.g., MobX or Zustand) without refactoring Redux.
    - Using a different styling approach (e.g., CSS-in-JS or Styled Components) instead of Tailwind.
    - Direct database access from client-side (architecturally inconsistent with a Next.js/Redux pattern).
    - Storing access tokens in `localStorage` or `sessionStorage` — the codebase uses `tokenStore.ts` (in-memory only) for XSS mitigation.
- **Specialized Libraries**:
    - `@paystack/inline-js`: Specific for Nigerian/African market payment processing.
    - `@jhaz-imprints/shared`: Internal package for shared logic/types across the monorepo.
    - `react-hook-form`: For complex multi-step checkout state.
