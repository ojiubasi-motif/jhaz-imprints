// lib/proxyRequest.js
// TODO-4: Reverse Proxy Core
//
// This module handles the actual HTTP forwarding from the gateway to a
// downstream microservice. It is a pure function — no module-level state.
//
// What it does:
//   1. Receives the incoming Express req/res pair + a target base URL.
//   2. Clones and sanitises headers (strips host + content-length).
//   3. Re-issues the same HTTP request (method, headers, body, query) to the target.
//   4. Forwards the downstream response (status + body) verbatim to the client.
//
// Headers stripped before forwarding:
//   - 'host'           : must be replaced by the downstream service's hostname.
//   - 'content-length' : needle recalculates this based on the forwarded body.
//
// Why needle?
//   Lightweight, no transitive dependencies, and sufficient for this MVP.
//   Future improvement: use http-proxy-middleware for true streaming (no buffering).

import needle from 'needle';
import url    from 'url';

/**
 * Forwards the current Express request to a downstream service URL.
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
  delete forwardHeaders['host'];           // must be the downstream host, not ours
  delete forwardHeaders['content-length']; // needle recalculates based on actual body

  try {
    const downstreamResponse = await needle(
      req.method.toLowerCase(),   // 'get', 'post', 'put', etc. — needle requires lowercase
      targetUrl,
      req.body,                   // undefined for GET — needle handles this cleanly
      {
        headers:        forwardHeaders,
        parse_response: false,    // don't attempt JSON parse — pass through raw bytes
        json:           req.is('application/json'), // set Content-Type if JSON body
      },
    );

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
