# Proxying Domain

The `proxying` domain performs HTTP request forwarding to downstream internal microservices.

## Consistent Patterns
- **Header Cleaning**: Strips `host` and `content-length` headers from client requests so they can be re-calculated for downstream target hosts.
- **Pass-through Response Handling**: Utilizes `needle` with `parse_response: false` to forward status codes and raw response bodies verbatim without parsing or buffering.
- **Network Resolution**: Dynamically formats destination URLs by appending the incoming path and query string to the target service base URL.

## Code Examples

**Verbatim Request Proxying (`packages/gateway/lib/proxyRequest.js`):**
```javascript
import needle from 'needle';
import url from 'url';

async function proxyRequest(req, res, targetBase) {
  const queryString = url.parse(req.url).search || '';
  const targetUrl = `${targetBase}${req.path}${queryString}`;

  const forwardHeaders = { ...req.headers };
  delete forwardHeaders['host'];
  delete forwardHeaders['content-length'];

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
