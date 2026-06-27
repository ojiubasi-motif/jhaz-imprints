// routes/index.js
// TODO-5: Service Routing
//
// This router is the final stage of the middleware pipeline.
// By the time a request reaches this router:
//   ✅ JWT has been validated (auth.js)
//   ✅ Role has been authorised (rbac.js)
//   ✅ Request has been logged (logger.js)
//
// All this router does is look at the path prefix and decide which
// downstream microservice to forward the request to.
//
// SERVICE_MAP is the authoritative registry.
// To add a new microservice:
//   1. Add `NEW_SERVICE_URL` to .env (root)
//   2. Add an entry to SERVICE_MAP here
//   3. Add permissions for each role in middleware/rbac.js
//   4. Add a startup log line in server.js

import express      from 'express';
import proxyRequest from '../lib/proxyRequest.js';

const router = express.Router();

// ─── Service Registry ─────────────────────────────────────────────────────────
// Maps URL path prefixes to downstream service base URLs.
// Loaded from environment variables so you can target different hosts
const SERVICE_MAP = {
  // Catalog microservice — products, admin product management, uploads
  '/api/v1/products':   process.env.CATALOG_SERVICE_URL,
  '/api/v1/categories': process.env.CATALOG_SERVICE_URL,
  '/api/v1/fabrics':    process.env.CATALOG_SERVICE_URL,
  '/api/v1/fabric-categories': process.env.CATALOG_SERVICE_URL,
  '/api/v1/admin':      process.env.CATALOG_SERVICE_URL,

  // Core API — auth, orders
  '/api/auth':        process.env.CORE_API_URL,
  '/api/orders':      process.env.CORE_API_URL,
};

/**
 * Resolves which downstream service should receive this request
 * based on the longest matching path prefix in SERVICE_MAP.
 * Longest-prefix matching prevents /api/v1 from catching /api/v1/admin.
 *
 * @param {string} path - e.g. "/api/v1/products/123"
 * @returns {{ prefix: string, serviceUrl: string } | null}
 */
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

// ─── Health Check ─────────────────────────────────────────────────────────────
// Self-check endpoint — never proxied to downstream services.
// Used by Docker Compose healthcheck and load balancers.
router.get('/health', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    gateway: 'jhaz-imprints-gateway',
    services: Object.fromEntries(
      Object.entries(SERVICE_MAP).map(([prefix, url]) => [prefix, url || 'NOT_CONFIGURED'])
    ),
  });
});

// ─── Catch-all Proxy Route ────────────────────────────────────────────────────
// Handles ALL methods (GET, POST, PUT, PATCH, DELETE) under /api/*.
// Express 5 requires the named wildcard syntax: *splat
router.all('/api/*splat', async (req, res) => {
  // Collapse multiple slashes for robust service resolution
  const normalizedPath = req.path.replace(/\/+/g, '/');
  const resolved = resolveService(normalizedPath);

  if (!resolved || !resolved.serviceUrl) {
    return res.status(404).json({
      error:   'NO_ROUTE',
      message: `No downstream service is registered for path "${req.path}".`,
    });
  }

  // Tag the destination on the request object so the logger can pick it up.
  req.proxyDestination = resolved.prefix;

  // Hand off to the proxy helper — this is where the actual HTTP call happens.
  await proxyRequest(req, res, resolved.serviceUrl);
});

export default router;
