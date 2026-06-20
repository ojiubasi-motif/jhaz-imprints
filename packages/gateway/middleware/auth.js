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

// Routes that don't require a JWT Bearer token.
// Public product browsing is intentionally unauthenticated.
// Webhook routes are secured by their own provider-specific signature, not JWT.
const PUBLIC_ROUTES = [
  { path: '/health',                          method: 'GET'  },
  { path: '/api/v1/products',                 method: 'GET'  },  // product listing
  { path: '/api/v1/products/',                method: 'GET'  },  // trailing-slash variant
  { path: '/api/v1/categories',               method: 'GET'  },  // categories listing
  { path: '/api/v1/categories/',              method: 'GET'  },
  { path: '/api/v1/fabrics',                  method: 'GET'  },  // fabrics listing
  { path: '/api/v1/fabrics/',                 method: 'GET'  },
  { path: '/api/auth/login',                  method: 'POST' },
  { path: '/api/auth/register',               method: 'POST' },
  { path: '/api/auth/refresh',                method: 'GET'  },  // refresh token uses its own mechanism
  // ── Password reset — no JWT required (user is not logged in) ─────────────
  // SECURITY (OWASP Forgot Password CS): These endpoints intentionally bypass
  // JWT auth. The forgot-password endpoint is protected by its own rate limiter.
  // The reset-password endpoint is protected by the CSPRNG token in the body.
  { path: '/api/auth/forgot-password',        method: 'POST' },
  { path: '/api/auth/reset-password',         method: 'POST' },
  // ── CSRF token and MFA verification endpoints ────────────────────────────
  { path: '/api/auth/csrf-token',             method: 'GET'  },
  { path: '/api/auth/admin/verify-otp',       method: 'POST' },
  // ── Webhook routes — no JWT, secured by provider HMAC signature instead ──
  { path: '/api/orders/webhook/paystack',     method: 'POST' },  // Paystack push events (HMAC-SHA512)
];

/**
 * Checks whether the current request targets a public (unauthenticated) route.
 * Product detail routes (/api/v1/products/:id) are also public.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isPublicRoute(req) {
  // Normalize the request path to handle double slashes and trailing slashes
  const cleanPath = req.path
    .replace(/\/+/g, '/') // Collapse multiple slashes (e.g. /api//auth/register -> /api/auth/register)
    .replace(/\/$/, '');  // Strip trailing slash if present (except for root '/')

  const normalizedPath = cleanPath || '/';

  // Exact-match check against normalized route paths
  const exactMatch = PUBLIC_ROUTES.some((route) => {
    const cleanRoutePath = route.path
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
    const normalizedRoutePath = cleanRoutePath || '/';
    return normalizedPath === normalizedRoutePath && req.method === route.method;
  });

  if (exactMatch) return true;

  // Product detail pages are public: GET /api/v1/products/<anything>
  if (req.method === 'GET' && /^\/api\/v1\/products\/[^/]+\/?$/.test(normalizedPath)) {
    return true;
  }

  // Fabric detail pages are public: GET /api/v1/fabrics/<anything>
  if (req.method === 'GET' && /^\/api\/v1\/fabrics\/[^/]+\/?$/.test(normalizedPath)) {
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
  const authHeader = req.headers['authorization'];
  // Expected format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  // Skip validation for public routes if no token is provided.
  if (isPublicRoute(req) && !token) {
    return next();
  }

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
    const eventType = isExpired ? 'token.expired' : 'token.invalid';

    // SECURITY (OWASP — Logging and Monitoring CS):
    // Log all auth failures with structured JSON so monitoring tools
    // (e.g. Datadog, CloudWatch, Grafana Loki) can alert on anomalies.
    console.log(JSON.stringify({
      event: eventType,
      ip: req.ip,
      path: req.path,
      method: req.method,
      ts: new Date().toISOString(),
    }));

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
