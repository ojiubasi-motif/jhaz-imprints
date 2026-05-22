# Authentication Domain Analysis - apps/web

## Patterns and Conventions

- **In-Memory Token Storage**: Access tokens are stored in `src/lib/tokenStore.ts` (never `localStorage`). The token is destroyed when the tab closes, limiting XSS exposure window.
- **Cookie-Based Refresh**: The refresh token is stored in an `httpOnly` cookie managed by the backend. `GET /auth/refresh` exchanges the cookie for a new access token.
- **Client-Side State**: Auth state (`user`, `isLoading`, `expiresAt`, `error`) is tracked in `authSlice`. `expiresAt` is derived from the JWT `exp` claim via `tokenStore.getExpiryTime()`.
- **Session Expiry Handling**: `apiClient` dispatches a global `auth-expired` window event on any `401` response. `AuthInitializer` listens to this event and calls `clearAuth()` + redirects to login.
- **Silent Restore**: On app mount, `AuthInitializer` dispatches `loadProfile()`, which calls `GET /auth/me`. If the refresh cookie is valid, the server restores the session and returns a new access token.
- **Proactive Refresh Scheduling**: `AuthInitializer` uses `setTimeout` to schedule a token refresh 60 seconds before `expiresAt`. The `apiClient` also refreshes proactively if `tokenStore.shouldRefresh()` returns true before any request.

## Auth State Shape

```typescript
interface AuthState {
  user: { id: string; email: string; role: 'CUSTOMER' | 'ADMIN' | 'TAILOR'; firstName?: string; lastName?: string; full_name?: string } | null;
  isLoading: boolean;      // Initialized as `true` — components must wait for this to be false
  error: string | null;
  expiresAt: number | null; // Token expiry in ms since epoch
}
```

## Code Examples

### Silent Restore (`AuthInitializer` in `Providers.tsx`)
```typescript
dispatch(loadProfile() as any).then((result: any) => {
  if (result.payload) {
    // Session restored — expiresAt and user are now set
  }
});
// Clear auth and redirect if backend rejects (401)
window.addEventListener('auth-expired', () => {
  dispatch(clearAuth());
  router.push('/auth/login?error=session-expired');
});
```

### Authentication Thunks (`authSlice.ts`)
Thunks store the access token via `tokenStore.setToken()` and return `expiresAt` from `tokenStore.getExpiryTime()`.
```typescript
export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const response = await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) });
      const { access_token, user } = response;
      tokenStore.setToken(access_token);
      return { user, expiresAt: tokenStore.getExpiryTime() };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Login Form (`src/components/auth/LoginForm.tsx`)
```tsx
const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
  resolver: zodResolver(LoginSchema)
});

const onSubmit = (data: LoginData) => {
  dispatch(loginUser(data));
};
```
