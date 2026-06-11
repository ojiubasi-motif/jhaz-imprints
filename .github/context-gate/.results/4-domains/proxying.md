# Proxying Domain

The `proxying` domain performs HTTP request forwarding to downstream internal microservices.

## Consistent Patterns
- **Header Cleaning**: Strips `host` and `authorization` headers from client requests. Stripping `authorization` ensures microservices do not re-verify JWTs. Strips `content-length` for normal requests, but preserves it for `multipart/*` uploads to allow downstream processing of file streams.
- **Identity & Secret Injection**: Injects `x-user-id`, `x-user-role`, and `x-user-email` headers populated by the gateway authentication middleware, plus a shared `x-internal-secret` so microservices can identify secure gateway origin.
- **Pass-through Response Handling**: Utilizes `needle` with `parse_response: false` to forward status codes and raw response bodies verbatim without parsing or buffering.
- **Network Resolution**: Dynamically formats destination URLs by appending the incoming path and query string to the target service base URL.

## Code Examples

**Verbatim Request Proxying (`packages/gateway/lib/proxyRequest.js`):**
```javascript
import needle from 'needle';
import url from 'url';

const INTERNAL_SECRET = process.env.INTERNAL_GATEWAY_SECRET;

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
```
