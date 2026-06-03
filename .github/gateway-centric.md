# Gateway-Centric Architecture Audit

## What Should Be True
1. Gateway is the ONLY entry point — validates JWT, enforces RBAC
2. Microservices trust the gateway — read forwarded identity, never re-validate JWT
3. Microservices reject requests that don't come from the gateway
4. Network isolation — microservices not directly reachable from outside

---

## Verdict: ❌ NOT correctly implemented

---

## Issue 1 — Microservices re-validate JWT (critical)

Both microservices have their own full JWT middleware:

**`packages/api/src/middleware/authenticate.ts`**
```ts
const decoded = jwt.verify(token, secret); // ← re-validates JWT
req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
```

**`packages/catalog-service/src/middleware/authenticate.ts`**
```ts
const decoded = jwt.verify(token, secret); // ← re-validates JWT
req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
```

Both microservices apply this on protected routes:
- `packages/api/src/routes/orders.ts` → `authenticate` on every route
- `packages/api/src/routes/auth.ts` → `authenticate` on /me
- `packages/catalog-service/src/routes/adminProducts.ts` → `authenticate + authorize`
- `packages/catalog-service/src/routes/uploads.ts` → `authenticate + authorize`

**Impact:** Any client with a valid JWT can hit the microservices directly — 
the gateway is bypassed entirely for auth purposes.

---

## Issue 2 — Gateway doesn't inject trusted identity headers (critical)

**`packages/gateway/lib/proxyRequest.js`**
```js
const forwardHeaders = { ...req.headers }; // clones original headers as-is
delete forwardHeaders['host'];
delete forwardHeaders['content-length'];
// ← never injects x-user-id, x-user-role, x-user-email
```

The gateway validates the JWT and sets `req.user`, `req.userId`, `req.userRole` — 
but NEVER passes this identity to downstream services via trusted headers.

In a gateway-centric architecture, the correct flow is:
```
Gateway:
  1. Validate JWT
  2. Strip Authorization header         ← not happening
  3. Inject x-user-id, x-user-role      ← not happening
  4. Forward to microservice

Microservice:
  1. Read x-user-id, x-user-role        ← not happening
  2. Trust them without re-validating   ← not happening
```

---

## Issue 3 — No internal request verification (critical)

The microservices have no mechanism to verify a request came from the gateway.
There is no:
- Internal API key / shared secret header
- IP allowlist check
- Mutual TLS

Any process on the `catalog-net` Docker network can call `core-api:5000` or
`catalog-service:3001` directly — no gateway needed.

---

## Issue 4 — Postgres exposed to host (minor)

**`docker-compose.yml`**
```yaml
postgres:
  ports:
    - "5433:5432"    # ← accessible from host machine directly
```

No immediate risk locally, but in a cloud deployment this bypasses the
gateway entirely for database access. Should be removed in production.

---

## What IS correct ✅

| Check | Status |
|---|---|
| Gateway does JWT validation | ✅ `middleware/auth.js` |
| Gateway does RBAC | ✅ `middleware/rbac.js` |
| `catalog-service` has no host port | ✅ internal only |
| `core-api` has no host port | ✅ internal only |
| `catalog-redis` has no host port | ✅ internal only |
| All services on same Docker network | ✅ `catalog-net` |
| Rate limiting at gateway | ✅ 200 req/15min |

---

## Fix Summary

| File | Fix needed |
|---|---|
| `packages/gateway/lib/proxyRequest.js` | Strip `Authorization` header, inject `x-user-id`, `x-user-role`, `x-user-email` + internal secret |
| `packages/api/src/middleware/authenticate.ts` | Replace JWT validation with trusted header reader |
| `packages/catalog-service/src/middleware/authenticate.ts` | Same as above |
| `docker-compose.yml` | Add `INTERNAL_GATEWAY_SECRET` env var to gateway + both microservices |
| `docker-compose.yml` | Remove `postgres` host port in production |