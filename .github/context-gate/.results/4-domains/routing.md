# Routing Domain

The `routing` domain resolves which downstream microservice handles an incoming request based on the path prefix. It is declared in `routes/index.js` and mounted in `server.js`.

## Consistent Patterns
- **Longest-Prefix Match**: Resolves target base URLs from a `SERVICE_MAP` based on the longest matching prefix to avoid conflicts (e.g. `/api/v1/products` vs `/api/v1`).
- **Express 5 Wildcard Syntax**: Captures matching routes under `/api/*splat` for proxying.
- **Inline Health Check**: Provides a `/health` endpoint directly inside the router that lists downstream mapping states without proxying.

## Code Examples

**Longest-Prefix Matching (`packages/gateway/routes/index.js`):**
```javascript
const SERVICE_MAP = {
  // Catalog microservice — products, admin product management, uploads
  '/api/v1/products':   process.env.CATALOG_SERVICE_URL,
  '/api/v1/categories': process.env.CATALOG_SERVICE_URL,
  '/api/v1/fabrics':    process.env.CATALOG_SERVICE_URL,
  '/api/v1/admin':      process.env.CATALOG_SERVICE_URL,

  // Core API — auth, orders
  '/api/auth':        process.env.CORE_API_URL,
  '/api/orders':      process.env.CORE_API_URL,
};

function resolveService(path) {
  let best = null;
  for (const [prefix, serviceUrl] of Object.entries(SERVICE_MAP)) {
    if (path.startsWith(prefix)) {
      if (!best || prefix.length > best.prefix.length) {
        best = { prefix, serviceUrl };
      }
    }
  }
  return best;
}
```

**Catch-All Routing:**
```javascript
router.all('/api/*splat', async (req, res) => {
  const resolved = resolveService(req.path);
  if (!resolved || !resolved.serviceUrl) {
    return res.status(404).json({
      error:   'NO_ROUTE',
      message: `No downstream service is registered for path "${req.path}".`,
    });
  }
  req.proxyDestination = resolved.prefix;
  await proxyRequest(req, res, resolved.serviceUrl);
});
```
