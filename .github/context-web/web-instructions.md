# Web App Development Instructions - @jhaz-imprints/web

## 1. Overview
This file provides architectural context, domain understanding, and stylistic guidelines for developing the `apps/web` application. It is based on observed patterns within the codebase to ensure that AI assistants and developers generate consistent, convention-following code.

---

## 2. File Category Reference

### **Next.js Pages (`next-pages`)**
- **Purpose**: Defines the routes and entry points for the application.
- **Examples**: `src/app/products/page.tsx`, `src/app/checkout/page.tsx`.
- **Key Conventions**:
  - Prefer Server Components for data fetching.
  - Use `params` for dynamic routes.
  - All routes reside in `src/app/`.

### **React Components (`react-components`)**
- **Purpose**: Reusable UI units.
- **Examples**: `src/components/products/ProductCard.tsx`, `src/components/layout/Navbar.tsx`.
- **Key Conventions**:
  - Use functional components: `export function ComponentName()`.
  - Use `"use client"` directive at the top if hooks are used.
  - Style exclusively with Tailwind CSS.

### **Redux Slices (`redux-slices`)**
- **Purpose**: State management logic for specific domains.
- **Examples**: `src/store/slices/authSlice.ts`, `src/store/slices/cartSlice.ts`.
- **Key Conventions**:
  - Use `createAsyncThunk` for API calls.
  - Handle thunk lifecycles in `extraReducers`.
  - Located in `src/store/slices/`.

### **Lib Utils (`lib-utils`)**
- **Purpose**: Shared helper functions and API clients.
- **Examples**: `src/lib/apiClient.ts`, `src/lib/tokenStore.ts`.
- **Key Conventions**:
  - Use the unified `fetchApi` from `apiClient.ts` for all network requests. It auto-injects the Bearer token, handles auto-refresh deduplication, and unwraps the Quizio envelope (`data.data`). Callers receive the payload directly — do NOT do `response.data`.
  - Use `tokenStore` for all access token reads/writes. NEVER use `localStorage` or `sessionStorage` for access tokens.
  - Ensure full TypeScript typing for all exports.
  - Lib modules must NOT import from Redux slices to avoid circular dependency errors.

---

## 3. Feature Scaffold Guide

When implementing a new feature (e.g., "Product Reviews"):

1.  **Define the Slice**: Create `src/store/slices/reviewsSlice.ts` using `createSlice` and `createAsyncThunk`.
2.  **Create Components**: Create `src/components/products/ProductReviews.tsx` using Tailwind CSS and the `card` utility.
3.  **Update the Store**: Register the new reducer in `src/store/index.ts`.
4.  **Add the Page Logic**: Integrate the component into `src/app/products/[slug]/page.tsx`.

### **Naming & Placement**
- Components: `PascalCase.tsx` in `src/components/{domain}/`.
- Slices: `camelCaseSlice.ts` in `src/store/slices/`.
- Utils: `camelCase.ts` in `src/lib/`.

---

## 4. Integration Rules

- **Styling**: **Tailwind CSS is mandatory.** Use theme colors: `primary` (#8B5A2B), `secondary` (#D4AF37), and `error` (#EF4444).
- **Data Fetching**: **Always use the unified `apiClient`** from `@/lib/apiClient`. It ensures consistent header management and cross-origin cookie support.
- **State**: **Use Redux Toolkit.** Access state via `useAppSelector` and `useAppDispatch` from `@/store/hooks`.
- **Auth & Persistence**: 
  - **PersistLogin Pattern**: The auth slice MUST initialize with `isLoading: true`. 
  - **Route Protection**: Protected components (like `CheckoutContent`) must NOT redirect to login if `isLoading` is true. They must wait for the profile refresh to complete.
  - **UI Hydration**: Use `auth.isLoading` to display skeleton loaders or placeholders in components like the Navbar to prevent UI flickering during session restoration.
  - **In-Memory Tokens**: Access tokens are stored in `tokenStore.ts` only (never `localStorage`). After login or register, call `tokenStore.setToken(access_token)` and store `tokenStore.getExpiryTime()` as `expiresAt` in auth state.
  - **Proactive Refresh**: `AuthInitializer` schedules a timeout 60 seconds before `expiresAt`. `apiClient` also refreshes proactively via `tokenStore.shouldRefresh()` before every request, using a deduplication lock to prevent refresh storms.
  - **Auth Expired**: `apiClient` dispatches `window.dispatchEvent(new Event('auth-expired'))` on `401`. Components/Providers must listen for this and call `dispatch(clearAuth())`.
  - **Next.js Rewrites**: Use `/api` rewrites in `next.config.js` during development to avoid SameSite cookie issues across different ports/origins.
- **Form Management**:
  - **Defensive Hydration**: When using `react-hook-form` with Redux-persisted drafts (like `cart.draft`), ensure that the draft data does not overwrite dynamic URL parameters (e.g., `productId`). Always prioritize the URL-sourced ID over the drafted ID.
  - **State Consistency (Mandatory Clearing)**: To prevent displaying stale data between different products, the `productsSlice` MUST clear `currentProduct` when `fetchProductById.pending` is triggered. Additionally, pages (like `CheckoutPage`) MUST dispatch `clearCurrentProduct` on unmount to ensure a clean state for the next user interaction.
  - **Defensive Rendering (ID Matching)**: Checkout steps that rely on Redux state (e.g., `FabricColourStep`, `StyleChoicesStep`) MUST verify that the `currentProduct._id` in the store matches the `productId` in the checkout context before rendering. If they don't match, display a loading skeleton or empty state to prevent option mismatch errors.
  - **Payload Cleaning**: Before submitting form data to the API, manually strip out `NaN` values, nulls, or empty strings for numerical fields (e.g., measurements) to avoid 400 Bad Request errors from strict backend Zod validation.
  - **Resilient Formatting**: When formatting dates (e.g., in `OrderCard` or `OrderStatusPage`), always use a fallback like `new Date(order.createdAt || Date.now())` to prevent `RangeError` crashes if data is missing or loading.
- **Payment & Offline Resilience**:
  - **Offline Detection**: Components should monitor `navigator.onLine` and provide a "Pay Later" or "Save Order" flow if the user is disconnected.
  - **Payment Verification UI**: The `OrderStatusPage` must handle multiple status parameters from the backend (`status=success`, `status=verifying`, `status=offline-pending`, `status=payment-pending`) to provide immediate visual confirmation and handle background verification delays.
  - **Manual Verification Fallback**: If the Paystack popup callback is interrupted, the component should attempt a manual `POST /orders/verify/:ref` call before redirecting to the status page.
  - **Enriched Order Display**: Use the `order.product` object (augmented by the backend) to display product images and names in order history components. Always handle the "Unknown" fallback if the object is null.
  - **createOrder Payload Shape**: On `createOrder.fulfilled`, `action.payload` contains `{ orderId, totalAmount, status, reference, paystackAccessCode, paymentUrl?, measurement? }`. Use `paystackAccessCode` with `PaystackPop.setup({ access_code })` and `totalAmount * 100` for the Paystack `amount` (converts Naira → kobo).
  - **Pending Payment Resume**: `Providers.tsx` listens for `window.online` and shows a modal to resume incomplete payments. Route to `/orders/:id?action=complete-payment`.
- **Error Handling**:
  - **Flow Isolation**: Use `CheckoutErrorBoundary` to wrap complex multi-step flows. This ensures that a failure in one step (e.g., an unexpected data shape) doesn't crash the entire application, allowing the user to "Try Again" or return home gracefully.

  - **Measurements (Checkout)**: The checkout flow supports saved customer measurement profiles that can be reused across orders or a "create new" flow. Frontend MUST:
    - Dispatch `fetchMyMeasurements` on `BodyMeasurementsStep` mount to load the user's saved profiles.
    - Auto-select the `isDefault` profile if one exists; fall back to `profiles[0]`; show "Create New Profile" UI if `items` is empty.
    - Allow selecting a profile (set `measurementId` in the form via `setValue`) or creating a new profile via `dispatch(createMeasurement(...))` and then setting the returned `payload.id` as `measurementId`.
    - Ensure `measurementId` (CUID) is present in the final `OrderCreate` payload. The form MUST block progression from step 0 (`BodyMeasurementsStep`) if `measurementId` is not set.
    - Store only non-sensitive measurement drafts in `cart.draft`; prefer referencing the saved `measurementId` for order creation.
    - `fetchApi` auto-unwraps responses — use `resultAction.payload.id` directly (not `resultAction.payload.data.id`).

---

## 5. Example Prompt Usage

> "Create a new section in the Account page to show saved addresses."

**Expected Files to Create/Modify**:
- `src/store/slices/addressSlice.ts` (State for addresses)
- `src/components/account/AddressList.tsx` (UI for listing addresses)
- `src/components/account/AddressForm.tsx` (UI for adding/editing)
- `src/app/account/page.tsx` (Integrate components)

---

### Example: Offline-Ready Payment Step

When implementing a payment step, follow the pattern in `ReviewPayStep.tsx`:

- **Network Status**: Use `navigator.onLine` and window events to toggle between "Pay Now" and "Pay Later".
- **Script Loading**: Dynamically load external SDKs (like Paystack) in a `useEffect` to keep the bundle lean.
- **Verification Logic**: 
  1. Dispatch `createOrder`.
  2. On success, open Paystack modal.
  3. In `callback`, dispatch `clearDraft` and redirect to a status page.
  4. Provide a `catch` block that redirects to a "verifying" status page if the callback is interrupted.
