# Utils Styleguide

## Unique Patterns
- **Pure Stateless Helper**: Proxy utility files are fully HTTP-agnostic functions that take the Express `req` and `res` objects and construct downstream target calls.
- **Header Stripping & Sanitization**: Explicitly deletes specific header keys (like `host` and `content-length`) before pass-through to prevent down-stream resolution errors.
- **Pass-through Streaming**: Uses `parse_response: false` on the request client to pipe responses back to clients verbatim.
