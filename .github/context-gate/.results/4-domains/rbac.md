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
    // Customers can browse the full catalogue — products, categories, fabrics.
    // These are public routes (bypass JWT), but listed here for defence-in-depth:
    // if a logged-in customer hits them, RBAC must not block with 403.
    { prefix: '/api/v1/products',          methods: ['GET'] },
    { prefix: '/api/v1/categories',        methods: ['GET'] },  // catalogue filter list
    { prefix: '/api/v1/fabrics',           methods: ['GET'] },  // fabric type filter list
    // Customers can register, login, manage their own profile
    { prefix: '/api/auth',                 methods: ['GET', 'POST', 'PUT', 'PATCH'] },
    // Customers can place and view their own orders
    { prefix: '/api/orders',               methods: ['GET', 'POST'] },
  ],
  ADMIN: [
    // Admins have full access to all routes
    { prefix: '/api/v1/products',          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/categories',        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/fabrics',           methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/admin',             methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/auth',                 methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/orders',               methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
  ],
  TAILOR: [
    // Tailors can browse products, fabrics, and view orders assigned to them
    { prefix: '/api/v1/products',          methods: ['GET'] },
    { prefix: '/api/v1/fabrics',           methods: ['GET'] },
    { prefix: '/api/v1/admin/products',    methods: ['GET'] },
    { prefix: '/api/orders',               methods: ['GET', 'PATCH'] }, // view + update status
    { prefix: '/api/auth',                 methods: ['GET', 'POST'] },
  ],
};

function authorise(req, res, next) {
  // Public routes don't have a userRole — skip RBAC for them.
  if (!req.userRole) {
    return next();
  }

  const allowedRoutes = PERMISSIONS[req.userRole];

  // If the role isn't in our matrix at all, deny immediately.
  if (!allowedRoutes) {
    return res.status(403).json({
      error:   'UNKNOWN_ROLE',
      message: `Role "${req.userRole}" is not recognised by this gateway.`,
    });
  }

  // Check if any permitted route matches this request's path + method.
  const isAuthorised = allowedRoutes.some(
    (route) =>
      req.path.startsWith(route.prefix) &&
      route.methods.includes(req.method),
  );

  if (!isAuthorised) {
    return res.status(403).json({
      error:   'FORBIDDEN',
      message: `Role "${req.userRole}" is not permitted to ${req.method} ${req.path}.`,
    });
  }

  next();
}
```
