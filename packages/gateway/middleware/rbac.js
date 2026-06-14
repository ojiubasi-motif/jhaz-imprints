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
 *   PERMISSIONS[role] = [{ prefix: '/api/path', methods: ['GET', 'POST'] }]
 *
 * A request is ALLOWED if its path STARTS WITH a permitted prefix
 * AND its HTTP method is in that prefix's methods array.
 */
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
    // Customers can place and view their own orders and manage measurements
    { prefix: '/api/orders',               methods: ['GET', 'POST', 'PUT', 'DELETE'] },
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

export default authorise;
