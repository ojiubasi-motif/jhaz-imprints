# Utils Styleguide

## Unique Patterns
- **Pure Stateless Helper**: Proxy utility files are fully HTTP-agnostic functions that take the Express `req` and `res` objects and construct downstream target calls.
- **Header Stripping & Sanitization**: Explicitly deletes specific header keys (like `host` and `authorization`) before forwarding to downstream targets. Stripping `authorization` prevents downstream JWT re-verification. Strips `content-length` for normal requests but preserves it for `multipart/*` uploads to enable downstream processing of file streams.
- **Identity & Secret Injection**: Injects trusted user identity headers (`x-user-id`, `x-user-role`, `x-user-email`) derived from `req.user`, along with the `x-internal-secret` (from `INTERNAL_GATEWAY_SECRET`) to authenticate the gateway origin.
- **Pass-through Streaming**: Uses `parse_response: false` on the request client to pipe responses back to clients verbatim.
