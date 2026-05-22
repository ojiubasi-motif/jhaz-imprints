# Lib Utils Style Guide - apps/web

## Core Principles

- **Purpose**: Utilities should be pure functions or specialized wrappers for global browser APIs (fetch, storage).
- **Location**: All utilities reside in `src/lib/`.
- **Typing**: Ensure all utility functions are fully typed using TypeScript.
- **No Side Effects**: Lib modules must not import from Redux (slices, store) — they are used by slices. Circular imports will cause build failures.

## Implementation Patterns

### API Client (`src/lib/apiClient.ts`)
The primary fetch utility. Manages token injection, auto-refresh deduplication, Quizio envelope unwrapping, and auth event dispatching.
- **Export**: `fetchApi(endpoint, options)` — use this for ALL API calls.
- **Auto-unwrap**: Returns `data.data` from Quizio envelope automatically. Callers receive the payload directly.
- **204 Handling**: Returns `null` for empty responses.

```typescript
// ✅ Correct usage
const measurements = await fetchApi('/orders/measurements');
// measurements is already the unwrapped array, not { msg, data, type, code }

// ❌ Wrong — don't do this
const res = await fetchApi('/orders/measurements');
const measurements = res.data; // undefined — already unwrapped
```

### Token Store (`src/lib/tokenStore.ts`)
In-memory access token storage. Never use `localStorage` or `sessionStorage` for access tokens.

```typescript
import { tokenStore } from '@/lib/tokenStore';

tokenStore.setToken(accessToken); // Store after login
tokenStore.getToken();            // Read before request
tokenStore.clear();               // Clear on logout or auth-expired
tokenStore.shouldRefresh();       // True if token expires in < 60s
tokenStore.getExpiryTime();       // Returns exp * 1000 (ms epoch)
```

## Naming Conventions
- Files should be `camelCase.ts` (e.g., `apiClient.ts`, `tokenStore.ts`).
- Exports should be named, not default.
