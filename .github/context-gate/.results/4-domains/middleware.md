# Middleware Domain

The `middleware` domain manages the flow and ordering of request intercepts before they are handed off to the routing and proxy layer.

## Consistent Patterns
- **Linear Ordered Pipeline**: Middleware is mounted sequentially in `server.js`.
- **Preflight Exclusions**: Logger and CORS run first to handle requests and preflights without auth blocks.
- **Rate Limiting**: Applied before JWT verification to avoid processing expensive signature checks for abusive clients.

## Code Examples

**Pipeline Order (`packages/gateway/server.js`):**
```javascript
// Middleware execution order matters:
//   1. requestLogger     → attaches first to time the entire lifecycle
//   2. cors              → allows cross-origin requests (preflight check)
//   3. express.json()    → parses incoming JSON body
//   4. rateLimit         → throttles requests early
//   5. authenticateToken → validates JWT (sets req.user/req.userId/req.userRole)
//   6. authorise         → enforces RBAC based on req.userRole
//   7. router            → routes requests to downstream endpoints
app.use(requestLogger);      // (1) attach timer + log on response

// (2) CORS configuration — trim whitespace from origins list
const corsOrigin = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true;  // Allow any origin if not configured

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());     // (3) parse JSON bodies
app.use(limiter);            // (4) rate limiting
app.set('trust proxy', 1);  //     trust first proxy (Render, nginx, etc.)

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(authenticateToken);  // (5) JWT validation — sets req.user, req.userId, req.userRole
app.use(authorise);          // (6) RBAC — checks role against permission matrix

// ─── Routing ──────────────────────────────────────────────────────────────────
app.use(router);             // (7) resolve SERVICE_MAP and proxy to downstream
```
