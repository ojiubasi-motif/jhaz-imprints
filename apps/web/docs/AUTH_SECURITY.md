# Web Auth Implementation — Security Audit

## Executive Summary

This implementation uses HTTP-only cookies for refresh tokens and in-memory storage for access tokens. It includes automatic token refresh with deduplication and proactive expiry handling to ensure users never experience mid-session authentication failures.

---

## Design Decisions & Rationale

### 1. **Access Token Storage: In-Memory Only**

**Decision**: The access token lives in a JavaScript variable (`tokenStore`), not in localStorage or sessionStorage.

**Why**:
- **XSS Protection**: If an attacker injects JavaScript (XSS), they can exfiltrate the token. However, the token is lost when the tab closes. localStorage persists the token across tabs and sessions, vastly expanding the attack window.
- **Automatic Cleanup**: Browser tab close automatically wipes the token from memory.
- **No Persistent Disk Copy**: No file-based storage that could be accessed by other processes.

**Risk**: XSS during the tab's lifetime can still steal the token. **Mitigation**: Rely on Content Security Policy (CSP), input sanitization, and dependency audits to prevent XSS.

---

### 2. **Refresh Token Storage: HTTP-Only Cookie**

**Decision**: The refresh token is stored in an HTTP-only, Secure, SameSite=None cookie set by the server.

**Why**:
- **Inaccessible to JavaScript**: JavaScript cannot read or delete an HTTP-only cookie, protecting it from XSS.
- **Auto-Sent with Requests**: The browser automatically includes the cookie with every request to the origin (when `credentials: 'include'` is set).
- **CSRF Protection**: `SameSite=None` requires `Secure` (HTTPS), and the server can validate the origin.

**Risk**: If an attacker controls the domain, they can steal the cookie. **Mitigation**: Use HTTPS, validate CORS headers, and monitor for suspicious token usage.

---

### 3. **Automatic Token Refresh Before Expiry**

**Decision**: Before each request, we check if the token is about to expire (< 60 seconds). If so, we silently refresh using the `/auth/refresh` endpoint.

**Why**:
- **User Experience**: Users never see a 401 error mid-flow; the token is refreshed proactively.
- **Security**: Short-lived tokens (15–60 minutes) reduce the impact of token theft.
- **Session Continuity**: Users can stay logged in indefinitely as long as the refresh token remains valid.

**How**:
```
1. Before each fetch, apiClient checks tokenStore.shouldRefresh().
2. If true, calls GET /auth/refresh (with httpOnly cookie).
3. Server validates refresh token, generates new access token, and rotates the refresh cookie.
4. Client stores new access token in memory.
5. Original request proceeds with fresh token.
```

---

### 4. **Deduplication of Concurrent Refresh Calls**

**Decision**: If multiple requests trigger refresh simultaneously, only one refresh request is made. All pending requests wait for the result.

**Why**:
- **Performance**: Avoids multiple redundant refresh calls when multiple requests fire at once.
- **Server Load**: Reduces unnecessary token validation and generation.
- **Security**: Single source of truth for token state.

**Implementation**: A shared promise (`_refreshing`) ensures only one GET /auth/refresh is in-flight.

---

### 5. **Proactive Refresh Scheduling**

**Decision**: The `Providers.tsx` component schedules a timer to refresh the token 60 seconds before expiry.

**Why**:
- **Resilience**: Even if the app idles, the token is refreshed before it expires.
- **Zero Downtime**: Background refresh ensures seamless user experience.

**How**: `scheduleRefresh()` calculates the time until expiry and sets a timer. When triggered, the next API call will auto-refresh.

---

### 6. **Auth-Expired Event**

**Decision**: When the server returns 401 (session expired or token invalid), `apiClient` clears the token and dispatches a global `auth-expired` event.

**Why**:
- **Decoupling**: Components don't need to know about token details; they listen for a high-level auth event.
- **Consistency**: All auth errors route through the same handler.

**Response**: `Providers` listens for this event and redirects to `/auth/login`.

---

### 7. **Silent Restore on App Mount**

**Decision**: When the app loads, `Providers` calls `loadProfile()`, which fetches `/auth/me`. If the refresh token (in the cookie) is valid, the server issues a new access token.

**Why**:
- **Session Persistence**: Users stay logged in across page reloads, as long as the refresh token is valid.
- **No Manual Login**: Seamless user experience after a page refresh.

**Failure Mode**: If the refresh token is expired or invalid, the request fails, and no user is set.

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **XSS → Token Theft** | Implement strict CSP headers; sanitize all user input; audit dependencies regularly; use security tools like Snyk. |
| **CSRF → Cookie Abuse** | Use SameSite cookies; validate Origin/Referer headers; token is only valid for API, not state-changing operations without CSRF tokens. |
| **Token Replay** | Use short-lived tokens (15–60 min); rotate refresh tokens on each refresh; bind tokens to IP/user agent if needed. |
| **Refresh Token Leak** | HTTP-only cookie prevents JS access; HTTPS prevents man-in-the-middle; monitor for unusual refresh patterns. |
| **Expired Session** | Proactive refresh + auto-restore from cookie ensure users rarely hit 401; clear UI feedback when auth is lost. |

---

## Testing Checklist

- [ ] **Login**: Token stored in memory; cookie set in browser.
- [ ] **Refresh**: Auto-refresh triggered < 60s before expiry; concurrent calls deduplicated.
- [ ] **Session Expiry**: 401 response clears token and redirects to login.
- [ ] **Page Reload**: Silent restore fetches user profile; token re-populated from refresh cookie.
- [ ] **Logout**: Both memory token and cookie cleared.
- [ ] **XSS Simulation**: Inject script to try `document.cookie`; httpOnly cookie is inaccessible (console should show "httpOnly").
- [ ] **CSP Violations**: Monitor browser console for CSP warnings.

---

## Future Hardening

1. **Rate Limiting**: Add brute-force protection on `/auth/login` (backend).
2. **Refresh Token Rotation**: Increment token version on each refresh; invalidate old versions.
3. **IP Pinning**: Optionally bind tokens to the IP they were issued to.
4. **Audit Logging**: Log auth events (login, logout, refresh, 401) for security monitoring.
5. **Device Fingerprinting**: Use user-agent + TLS fingerprinting to detect token theft.
