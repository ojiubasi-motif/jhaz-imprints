// server.js
// API Gateway — Entry Point for Jhaz-imprints
//
// Middleware execution order matters. Here is why each layer is ordered this way:
//
//   1. requestLogger     → attaches first so it can time the ENTIRE request lifecycle,
//                          including auth and RBAC failures.
//   2. cors              → allows cross-origin requests (before auth so preflight works).
//   3. express.json()    → parses request bodies before any logic reads req.body.
//   4. rateLimit         → throttles abusive IPs before we do any crypto work.
//   5. authenticateToken → validates the JWT; sets req.user, req.userId, req.userRole.
//                          Public routes bypass this step.
//   6. authorise         → checks role permissions; depends on req.userRole from step 5.
//   7. router            → resolves SERVICE_MAP, sets req.proxyDestination, proxies.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import requestLogger from './middleware/logger.js';
import authenticateToken from './middleware/auth.js';
import authorise from './middleware/rbac.js';
import router from './routes/index.js';

const PORT = process.env.GATEWAY_PORT || 8080;
const app = express();

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Protects the gateway from brute-force and DoS attacks.
// 200 req / 15 min per IP — adjust for production requirements.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(requestLogger);      // (1) attach timer + log on response

// (2) CORS configuration — trim whitespace from origins list
const corsOrigin = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'ALLOWED_ORIGINS must be set in production (e.g. https://jhazimprints.vercel.app)'
        );
      }
      console.warn('[Gateway] ALLOWED_ORIGINS not set — allowing all origins (dev only)');
      return true;
    })();

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());     // (3) parse JSON bodies
// ─── Trust Proxy ──────────────────────────────────────────────────────────────
// Railway (and other PaaS) use a reverse proxy in front of the gateway.
// This MUST be set before the rate limiter so express-rate-limit reads
// the real client IP from X-Forwarded-For, not the proxy's IP.
app.set('trust proxy', 1);

app.use(limiter);            // (4) rate limiting

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(authenticateToken);  // (5) JWT validation — sets req.user, req.userId, req.userRole
app.use(authorise);          // (6) RBAC — checks role against permission matrix

// ─── Routing ──────────────────────────────────────────────────────────────────
app.use(router);             // (7) resolve SERVICE_MAP and proxy to downstream

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Express 5 automatically propagates async errors to this handler.
app.use((err, req, res, _next) => {
  console.error('[Gateway Error]', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred in the gateway.',
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Jhaz-imprints API Gateway running on port ${PORT}`);
  console.log(`   Catalog Service → ${process.env.CATALOG_SERVICE_URL}`);
  console.log(`   Core API        → ${process.env.CORE_API_URL}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Railway sends SIGTERM on deploy/restart. Stop accepting new connections,
// drain in-flight requests, then exit cleanly.
function gracefulShutdown(signal) {
  console.log(`[Gateway] ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('[Gateway] All connections drained. Exiting.');
    process.exit(0);
  });
  // Force exit after 10s if connections aren't drained
  setTimeout(() => {
    console.error('[Gateway] Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
