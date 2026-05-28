// middleware/auth.js
// TODO-1: Edge JWT Validation
//
// This middleware is the gateway's first security gate.
// Every request (except public routes) must carry a valid Bearer token.
//
// What it does:
//   1. Checks if the request targets a PUBLIC_ROUTE — if so, skips auth entirely.
//   2. Pulls the Authorization header from the request.
//   3. Verifies the JWT signature and expiry using jsonwebtoken.
//   4. If valid → attaches the decoded payload to req.user and calls next().
//   5. If invalid/missing → responds immediately with 401; request goes no further.
//
// Why centralise JWT validation at the gateway?
//   Downstream services (catalog-service, core API) can trust that an incoming
//   request has already been authenticated. No duplicated crypto code across services.
//   The shared JWT_SECRET is the only coupling required — no database call.

import jwt from 'jsonwebtoken';

// Routes that don't require a token.
// Public product browsing is intentionally unauthenticated.
const PUBLIC_ROUTES = [
  { path: '/health',                   method: 'GET'  },
  { path: '/api/v1/products',          method: 'GET'  },  // product listing
  { path: '/api/v1/products/',         method: 'GET'  },  // trailing-slash variant
  { path: '/api/auth/login',           method: 'POST' },
  { path: '/api/auth/register',        method: 'POST' },
];

/**
 * Checks whether the current request targets a public (unauthenticated) route.
 * Product detail routes (/api/v1/products/:id) are also public.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isPublicRoute(req) {
  // Exact-match check
  const exactMatch = PUBLIC_ROUTES.some(
    (route) => req.path === route.path && req.method === route.method,
  );
  if (exactMatch) return true;

  // Product detail pages are public: GET /api/v1/products/<anything>
  if (req.method === 'GET' && /^\/api\/v1\/products\/[^/]+$/.test(req.path)) {
    return true;
  }

  return false;
}

/**
 * JWT validation middleware.
 * Attaches `req.user` (decoded payload), `req.userId`, and `req.userRole`
 * for use by downstream middleware (RBAC, logger).
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
function authenticateToken(req, res, next) {
  // Skip validation for public routes.
  if (isPublicRoute(req)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  // Expected format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error:   'MISSING_TOKEN',
      message: 'Authorization token is required.',
    });
  }

  try {
    // jwt.verify throws synchronously if the token is invalid or expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded claims for downstream middleware.
    req.user     = decoded;
    req.userId   = decoded.sub || decoded.id;
    req.userRole = decoded.role;

  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error:   isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired
        ? 'Your session has expired. Please log in again.'
        : 'The provided token is invalid.',
    });
  }

  next();
}

export default authenticateToken;
