# Style Guide: `lib-utilities`

## What Makes This Project Unique

### 1. Single Exported Singleton — Never Instantiate Twice
`src/lib/supabase.ts` exports a single `supabase` client instance. No component or module ever calls `createClient()` directly:
```typescript
// ✅ Correct — import the singleton
import { supabase } from '../lib/supabase';

// ❌ Wrong — never do this in a component
import { createClient } from '@supabase/supabase-js';
const client = createClient(...);
```

### 2. Credentials Are Always From `import.meta.env`
The Supabase URL and anon key always come from Vite environment variables — never hardcoded:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```
Both variables must exist in `.env` (which is gitignored) for the app to function.

### 3. `lib/` Is for Infrastructure, Not Business Logic
The `lib/` folder contains only infrastructure adapters (the Supabase client, the API client, and the token store). Domain logic (filtering, formatting) lives in the component files directly. Keep `lib/` minimal.

### 4. No Type-Safe Supabase Schema Generation (Yet)
The codebase casts Supabase responses manually:
```typescript
if (!error && data) {
  setProducts(data as Product[]);
}
```
No Supabase-generated types or `Database` generic type is used. Any future schema types should follow the same `as TypeName` cast pattern for consistency.

### 5. Shared Utility Helpers
`src/lib/utils.ts` contains pure functional helpers for formatting and pricing conversions:
- `formatNaira(amount: number): string` — formats numbers using `en-NG` locale and `NGN` currency token.
- `convertPrice(price: number): number` — converts catalog prices (raw base values) to standard Naira values.
Import these helpers rather than duplicating formatting configurations locally.

### 6. REST API Client — Always Use `fetchApi()`, Never Raw `fetch()`
`src/lib/apiClient.ts` exports `fetchApi(endpoint, options?)` as the single gateway to the REST API:
```typescript
import { fetchApi } from '../lib/apiClient';

// ✅ Correct
const data = await fetchApi('/auth/me');
const result = await fetchApi('/orders', { method: 'POST', body: JSON.stringify(payload) });

// ❌ Wrong — bypasses token refresh, auth headers, and 401 handling
const res = await fetch('http://localhost:8080/api/auth/me');
```
`fetchApi` automatically:
- Attaches `Authorization: Bearer <token>` from `tokenStore`
- Proactively refreshes the access token before expiry (< 60 second window)
- Deduplicates concurrent refresh calls via a shared promise
- Unwraps the `{ data: ... }` envelope pattern
- Dispatches `auth-expired` window event on 401 responses

The `API_BASE_URL` defaults to `/api` (routed through the Vite dev proxy) and can be overridden via `import.meta.env.VITE_API_URL` for production.

### 7. In-Memory Token Store — Never Persist Access Tokens
`src/lib/tokenStore.ts` is the **only** place access tokens are stored. It is a module-level singleton:
```typescript
import { tokenStore } from '../lib/tokenStore';

tokenStore.setToken(accessToken);   // Called by authSlice thunks after login
tokenStore.getToken();              // Called by apiClient before each request
tokenStore.clear();                 // Called on logout or 401
tokenStore.shouldRefresh();         // true if expiry is < 60 seconds away
```
**Never** write an access token to `localStorage`, `sessionStorage`, or a cookie. The refresh token is managed exclusively by the httpOnly cookie on the server side.
