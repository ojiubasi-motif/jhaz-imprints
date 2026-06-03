# Proxying Domain

The `proxying` domain performs HTTP request forwarding to downstream internal microservices.

## Consistent Patterns
- **Header Cleaning**: Strips `host`, `content-length`, and `authorization` headers from client requests. Stripping `authorization` ensures microservices do not re-verify JWTs.
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
  const queryString = url.parse(req.url).search || '';
  const targetUrl = `${targetBase}${req.path}${queryString}`;

  const forwardHeaders = { ...req.headers };
  delete forwardHeaders['host'];
  delete forwardHeaders['content-length'];
  delete forwardHeaders['authorization'];

  if (req.user) {
    forwardHeaders['x-user-id']    = String(req.user.id    ?? '');
    forwardHeaders['x-user-role']  = String(req.user.role  ?? '');
    forwardHeaders['x-user-email'] = String(req.user.email ?? '');
  }

  if (INTERNAL_SECRET) {
    forwardHeaders['x-internal-secret'] = INTERNAL_SECRET;
  }

  try {
    const downstreamResponse = await needle(
      req.method.toLowerCase(),
      targetUrl,
      req.body,
      {
        headers:        forwardHeaders,
        parse_response: false,
        json:           req.is('application/json'),
      }
    );
    res.status(downstreamResponse.statusCode).send(downstreamResponse.body);
  } catch (err) {
    res.status(502).json({ error: 'BAD_GATEWAY' });
  }
}
```
