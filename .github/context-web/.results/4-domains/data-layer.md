# Data Layer Domain Analysis - apps/web

## Patterns and Conventions

- **Centralized Fetch**: Uses a custom `fetchApi` wrapper in `src/lib/apiClient.ts` (NOT `api.ts`).
- **Environment Driven**: `API_BASE_URL` is derived from `process.env.NEXT_PUBLIC_API_URL || "/api"`.
- **Session Support**: `credentials: 'include'` is set by default to send the httpOnly refresh cookie.
- **In-Memory Token**: The access token is read from `tokenStore` and injected as `Authorization: Bearer <token>` before every request.
- **Auto-Refresh**: Before each request, `ensureToken()` checks `tokenStore.shouldRefresh()`. If the token expires in < 60 seconds, it silently calls `GET /auth/refresh`. Concurrent refresh calls are deduplicated via a shared `_refreshing` promise.
- **Quizio Envelope Unwrapping**: `fetchApi` automatically unwraps the Quizio response envelope — if the response body has a `data` key, it returns `data.data` (the payload), not the full envelope. Callers receive the payload directly.
- **204 Handling**: Returns `null` for `204 No Content` responses without attempting to parse JSON.
- **Error Handling**:
  - On `401`: clears `tokenStore`, dispatches `auth-expired` event, and throws.
  - On non-2xx: throws using `data?.msg || response.statusText`.

## Measurement Endpoints

- The web app relies on two measurement endpoints used in the checkout flow:
  - `GET /api/orders/measurements` — returns the user's saved measurement profiles.
  - `POST /api/orders/measurements` — creates a new measurement profile and returns the new profile (including `id`).

Example usage with `fetchApi`:
```ts
// List profiles (fetchApi auto-unwraps data envelope)
const profiles = await fetchApi('/orders/measurements');

// Create profile
const newProfile = await fetchApi('/orders/measurements', {
  method: 'POST',
  body: JSON.stringify({ profileName: 'Order 1', chest: 40, waist: 32, length: 48 })
});
const profileId = newProfile.id;
```

## Code Examples

### Fetch Wrapper (`src/lib/apiClient.ts`)
```typescript
export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // 1. Auto-refresh token if expiring soon (< 60s)
  const token = await ensureToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  // 2. Handle 204 No Content
  if (response.status === 204) return null;

  const data = await response.json();

  // 3. Handle 401 — session expired
  if (response.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error(data?.msg || 'Session expired');
  }

  if (!response.ok) throw new Error(data?.msg || `API error: ${response.statusText}`);

  // 4. Auto-unwrap Quizio envelope
  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}
```

### tokenStore (`src/lib/tokenStore.ts`)
```typescript
export const tokenStore = {
  getToken(): string | null { /* ... */ },
  setToken(token: string | null): void { /* ... */ },
  clear(): void { /* ... */ },
  shouldRefresh(): boolean { return this.getTimeUntilExpiry() < 60 * 1000; },
  getExpiryTime(): number | null { /* reads exp from JWT payload */ },
};
```
