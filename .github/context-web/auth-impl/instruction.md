`tokenStore` — access token lives in a plain JS variable only. Never `localStorage`, never `sessionStorage`. Tab close wipes it automatically.

`apiClient` — every `fetch` call includes `credentials: "include"` so the browser automatically sends the httpOnly cookie. If the access token is expired, it silently calls `/accounts/auth/refresh` before the request. Concurrent refresh calls are deduplicated with a shared promise (`_refreshing`).

`AuthProvider` — on mount, tries a silent refresh to restore a prior session from the cookie. `scheduleRefresh()` sets a timer to proactively refresh 60 seconds before expiry so users never see a mid-session kick.

JWT inspector tab — live countdown of the access token's remaining lifetime using the `exp` claim, with a draining progress bar.

Security audit tab — annotated analysis of every security decision in your `routes/auth.js`, including the two things worth hardening: CryptoJS AES is symmetric encryption (not hashing — no rainbow table protection), and there's no brute-force rate limiting on the login endpoint.