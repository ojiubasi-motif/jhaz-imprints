# Role-Based Access Control (RBAC) Domain

The `rbac` domain enforces access permissions at the gateway edge by checking user roles against allowed routes and methods.

## Consistent Patterns
- **Deny-by-Default Matrix**: Maps roles (`CUSTOMER`, `ADMIN`, `TAILOR`) to permitted route prefixes and HTTP methods.
- **Bypass for Unauthenticated Public Paths**: Bypasses check if no user role was injected by the authentication layer.

## Code Examples

**Role-Based Access Control Middleware (`packages/gateway/middleware/rbac.js`):**
```javascript
const PERMISSIONS = {
  CUSTOMER: [
    { prefix: '/api/v1/products', methods: ['GET'] },
    { prefix: '/api/auth',        methods: ['GET', 'POST', 'PUT', 'PATCH'] },
    { prefix: '/api/orders',      methods: ['GET', 'POST'] },
  ],
  ADMIN: [
    { prefix: '/api/v1/products', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/admin',    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/auth',        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/orders',      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
  ],
  TAILOR: [
    { prefix: '/api/v1/products',       methods: ['GET'] },
    { prefix: '/api/v1/admin/products', methods: ['GET'] },
    { prefix: '/api/orders',            methods: ['GET', 'PATCH'] },
  ],
};

function authorise(req, res, next) {
  if (!req.userRole) return next(); // Public route bypass
  const allowed = PERMISSIONS[req.userRole];
  if (!allowed) {
    return res.status(403).json({ error: 'UNKNOWN_ROLE' });
  }

  const isAuthorised = allowed.some(
    (route) => req.path.startsWith(route.prefix) && route.methods.includes(req.method)
  );

  if (!isAuthorised) {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }
  next();
}
```
