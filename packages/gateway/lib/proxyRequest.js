// lib/proxyRequest.js
// Reverse Proxy Core — Gateway-Centric Identity Forwarding
//
// This module handles the actual HTTP forwarding from the gateway to a
// downstream microservice. It implements the gateway-centric auth pattern:
//
//   Gateway flow:
//     1. Validate JWT (middleware/auth.js)
//     2. Strip Authorization header          ← prevents JWT re-validation downstream
//     3. Inject x-user-* trusted headers     ← forwarded identity
//     4. Inject x-internal-secret            ← lets microservices verify source
//     5. Forward to microservice
//
//   Microservice flow:
//     1. Verify x-internal-secret matches INTERNAL_GATEWAY_SECRET
//     2. Read x-user-id, x-user-role, x-user-email
//     3. Trust them — no JWT re-validation
//
// Headers stripped before forwarding:
//   - 'host'            : must be the downstream hostname.
//   - 'content-length'  : needle recalculates based on actual body.
//   - 'authorization'   : JWT never forwarded — identity is carried via x-user-* headers.
//
// Why needle?
//   Lightweight, no transitive dependencies, sufficient for this use case.
//   Future improvement: http-proxy-middleware for true streaming.

import needle from 'needle';
import url    from 'url';

const INTERNAL_SECRET = process.env.INTERNAL_GATEWAY_SECRET;

/**
 * Forwards the current Express request to a downstream service URL,
 * stripping the Authorization header and injecting trusted identity headers.
 *
 * @param {import('express').Request}  req        - Incoming Express request.
 * @param {import('express').Response} res        - Express response to write into.
 * @param {string}                     targetBase - Base URL of the downstream service
 *                                                  e.g. "http://catalog-service:3001"
 */
async function proxyRequest(req, res, targetBase) {
  // Build the full downstream URL: targetBase + path + original query string.
  const queryString = url.parse(req.url).search || '';
  const targetUrl   = `${targetBase}${req.path}${queryString}`;

  // Clone and sanitise headers before forwarding.
  const forwardHeaders = { ...req.headers };

  // ── Security: strip headers that must not reach downstream services ──────
  delete forwardHeaders['host'];          // must be the downstream host, not ours
  delete forwardHeaders['authorization']; // JWT never forwarded — use x-user-* instead

  // ── Multipart detection ───────────────────────────────────────────────────
  // For file uploads (multipart/form-data), the raw request stream must be
  // piped to needle — req.body is empty because express.json() doesn't consume it.
  // content-length must be preserved so downstream busboy/multer can frame the stream.
  // For all other requests (JSON, urlencoded), delete content-length so needle
  // recalculates it based on the serialised body.
  const isMultipart = req.is('multipart/*');
  if (!isMultipart) {
    delete forwardHeaders['content-length'];
  }

  // ── Gateway-Centric Identity Injection ───────────────────────────────────
  // If the auth middleware has validated and attached a user, forward their
  // identity as trusted headers so microservices don't need to re-validate JWT.
  if (req.user) {
    forwardHeaders['x-user-id']    = String(req.user.id    ?? '');
    forwardHeaders['x-user-role']  = String(req.user.role  ?? '');
    forwardHeaders['x-user-email'] = String(req.user.email ?? '');
  }

  // ── Internal Secret ───────────────────────────────────────────────────────
  // Allows microservices to reject requests that didn't come from the gateway.
  if (INTERNAL_SECRET) {
    forwardHeaders['x-internal-secret'] = INTERNAL_SECRET;
  }

  try {
    // For multipart uploads: stream req directly so the file bytes reach downstream.
    // For JSON/other: pass the already-parsed req.body.
    const body = isMultipart ? req : req.body;

    const downstreamResponse = await needle(
      req.method.toLowerCase(),   // 'get', 'post', 'put', etc. — needle requires lowercase
      targetUrl,
      body,
      {
        headers:        forwardHeaders,
        parse_response: false,    // don't attempt JSON parse — pass through raw bytes
        parse_cookies:  false,    // keep set-cookie in headers, don't move to .cookies
        json:           !isMultipart && req.is('application/json'), // only for JSON bodies
      },
    );

    // ── Forward downstream response headers back to the client ───────────────
    // Excludes hop-by-hop headers that Express/Node manages natively.
    const skipHeaders = ['connection', 'content-length', 'transfer-encoding', 'keep-alive'];
    for (const [key, value] of Object.entries(downstreamResponse.headers)) {
      if (!skipHeaders.includes(key.toLowerCase()) && value !== undefined) {
        res.set(key, value);
      }
    }

    // Forward the downstream status code and body verbatim to the original client.
    res.status(downstreamResponse.statusCode).send(downstreamResponse.body);

  } catch (err) {
    // Network-level error (downstream service unreachable, timeout, DNS failure, etc.)
    console.error(`[Proxy] Failed to reach ${targetUrl}:`, err.message);
    res.status(502).json({
      error:   'BAD_GATEWAY',
      message: 'Unable to reach the downstream service. Please try again later.',
    });
  }
}

export default proxyRequest;

