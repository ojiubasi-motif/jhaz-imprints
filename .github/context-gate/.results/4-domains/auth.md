# Authentication Domain

The `auth` domain handles edge JWT validation using a shared cryptographic secret, preventing unauthenticated traffic from entering internal networks.

## Consistent Patterns
- **Public Route Bypass**: Defines explicit bypass checks for endpoints like login, registration, and product catalogs.
- **Header Parsing**: Extracts standard `Bearer <token>` tokens from the `Authorization` header.
- **Claim Injection**: Attaches decoded tokens to `req.user`, `req.userId`, and `req.userRole` for downstream authorization and logging.

## Code Examples

**JWT Authentication Middleware (`packages/gateway/middleware/auth.js`):**
```javascript
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
  // ── Webhook routes — no JWT, secured by provider HMAC signature instead ──
  { path: '/api/orders/webhook/paystack',     method: 'POST' },  // Paystack push events (HMAC-SHA512)
];

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
```
