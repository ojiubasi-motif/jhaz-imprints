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
  { path: '/api/auth/login',                  method: 'POST' },
  { path: '/api/auth/register',               method: 'POST' },
  { path: '/api/auth/refresh',                method: 'GET'  },  // refresh token uses its own mechanism
  // ── Webhook routes — no JWT, secured by provider HMAC signature instead ──
  { path: '/api/orders/webhook/paystack',     method: 'POST' },  // Paystack push events (HMAC-SHA512)
];

function isPublicRoute(req) {
  const exactMatch = PUBLIC_ROUTES.some(
    (route) => req.path === route.path && req.method === route.method,
  );
  if (exactMatch) return true;
  // Product detail pages are also public: GET /api/v1/products/:id
  if (req.method === 'GET' && /^\/api\/v1\/products\/[^/]+$/.test(req.path)) {
    return true;
  }
  return false;
}

function authenticateToken(req, res, next) {
  if (isPublicRoute(req)) return next();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'MISSING_TOKEN', message: 'Token is required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.sub || decoded.id;
    req.userRole = decoded.role;
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
  next();
}
```
