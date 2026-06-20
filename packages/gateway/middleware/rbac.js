// middleware/rbac.js
// TODO-2: Strict Role-Based Access Control (RBAC)
//
// Authentication proves WHO you are (handled by auth.js).
// Authorisation proves WHAT you're allowed to do — that's this file's job.
//
// How it works:
//   - A permission matrix maps each role to a list of allowed route prefixes + HTTP methods.
//   - For every authenticated request, we check if the user's role permits that
//     HTTP method on that path prefix.
//   - If not → HTTP 403 Forbidden (request never reaches the downstream service).
//
// Roles in jhaz-imprints:
//   CUSTOMER — end users who browse and order
//   ADMIN    — store administrators who manage products and view all orders
//   TAILOR   — tailors who view assigned orders and product specs
//
// Adding a new microservice:
//   1. Add entries to PERMISSIONS for each role that should access it.
//   2. Add the path prefix to SERVICE_MAP in routes/index.js.

/**
 * Permission matrix.
 *
 * Structure:
 *   PERMISSIONS[role] = [{ prefix: '/api/path', methods: ['GET', 'POST'], exact?: true }]
 *
 * A request is ALLOWED if:
 *   - exact: false/undefined → path STARTS WITH the prefix AND method is permitted
 *   - exact: true            → path EQUALS the prefix exactly AND method is permitted
 *
 * SECURITY (OWASP — Authorization): Use exact:true for any prefix that sits adjacent
 * to admin-only sub-paths, preventing future route additions from being inadvertently
 * accessible to lower-privilege roles through prefix bleed-through.
 */
const PERMISSIONS = {
  CUSTOMER: [
    // Customers can browse the full catalogue — products, categories, fabrics.
    // These are public routes (bypass JWT), but listed here for defence-in-depth:
    // if a logged-in customer hits them, RBAC must not block with 403.
    { prefix: '/api/v1/products',    methods: ['GET']                          },
    { prefix: '/api/v1/categories',  methods: ['GET']                          },
    { prefix: '/api/v1/fabrics',     methods: ['GET']                          },
    // Customers can register, login, manage their own profile
    { prefix: '/api/auth',           methods: ['GET', 'POST', 'PUT', 'PATCH']  },
    // Customers can manage their own measurements profile
    { prefix: '/api/orders/measurements', methods: ['GET', 'POST', 'PUT']      },
    // Customers can place, view, and cancel their own orders.
    // SECURITY: exact:false is safe here only because downstream API enforces
    // user-scoping (orders/:id ownership check). However, we explicitly exclude
    // any /admin sub-path via the deny-admin guard below.
    { prefix: '/api/orders',         methods: ['GET', 'POST', 'DELETE']        },
  ],
  ADMIN: [
    // Admins have full access to all routes
    { prefix: '/api/v1/products',    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/categories',  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/fabrics',     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/v1/admin',       methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/auth',           methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { prefix: '/api/orders',         methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
  ],
  TAILOR: [
    // Tailors can browse products, fabrics, and view orders assigned to them
    { prefix: '/api/v1/products',        methods: ['GET'] },
    { prefix: '/api/v1/fabrics',         methods: ['GET'] },
    // SECURITY: exact:true — TAILOR may only GET this specific admin sub-path
    // and must not gain access to sibling admin paths (e.g. /api/v1/admin/users)
    // added in future without an RBAC review.
    { prefix: '/api/v1/admin/products',  methods: ['GET'], exact: true },
    { prefix: '/api/orders',             methods: ['GET', 'PATCH'] },
    { prefix: '/api/auth',               methods: ['GET', 'POST']  },
  ],
};

/**
 * RBAC evaluation middleware.
 * Must run AFTER authenticateToken so req.userRole is already set.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
function authorise(req, res, next) {
  // Public routes don't have a userRole — skip RBAC for them.
  if (!req.userRole) {
    return next();
  }

  const allowedRoutes = PERMISSIONS[req.userRole];

  // If the role isn't in our matrix at all, deny immediately.
  if (!allowedRoutes) {
    return res.status(403).json({
      error: 'UNKNOWN_ROLE',
      message: `Role "${req.userRole}" is not recognised by this gateway.`,
    });
  }

  // ── Check if any permitted route matches this request's path + method ─────
  // SECURITY: exact:true entries use strict equality; prefix entries use
  // startsWith. This prevents lower-privilege roles from gaining access to
  // new admin sub-paths added in future route expansions.
  const isAuthorised = allowedRoutes.some((route) => {
    const methodMatch = route.methods.includes(req.method);
    if (!methodMatch) return false;

    // SECURITY: Admin path deny-guard for CUSTOMER.
    // Even though /api/orders prefix-matches broadly, explicitly block any path
    // that looks like an admin sub-route under orders.
    if (req.userRole === 'CUSTOMER' && req.path.startsWith('/api/orders/admin')) {
      return false;
    }

    if (route.exact) {
      // Exact match: normalize path and compare strictly
      const normalizedPath = req.path.replace(/\/+$/, '').replace(/\/+/g, '/');
      const normalizedPrefix = route.prefix.replace(/\/+$/, '').replace(/\/+/g, '/');
      return normalizedPath === normalizedPrefix;
    }

    return req.path.startsWith(route.prefix);
  });

  if (!isAuthorised) {
    // SECURITY (OWASP — Logging & Monitoring CS):
    // Log authorization failures in a structured JSON format to aid in intrusion detection.
    console.log(JSON.stringify({
      event: 'authorization.failed',
      userId: req.userId || null,
      role: req.userRole || null,
      ip: req.ip,
      path: req.path,
      method: req.method,
      ts: new Date().toISOString(),
    }));

    return res.status(403).json({
      error: 'FORBIDDEN',
      message: `Role "${req.userRole}" is not permitted to ${req.method} ${req.path}.`,
    });
  }

  next();
}

export default authorise;
