# Logging Domain

The `logging` domain handles structured request-response logging at the edge of the system.

## Consistent Patterns
- **Post-Response Event Hooks**: Logs entries inside the Express response `'finish'` event to capture the true execution duration and final HTTP status code.
- **Structured JSON Stdout**: Writes single-line JSON logs to standard output for indexing by log aggregators.
- **Enriched Logging Metadata**: Captures request metrics including timestamp, client IP, HTTP method, path, user role, user ID, status code, duration, and the target backend destination.

## Code Examples

**Structured Request Logging Middleware (`packages/gateway/middleware/logger.js`):**
```javascript
function requestLogger(req, res, next) {
  // Record the moment the request arrived at the gateway.
  const startTime = Date.now();

  // Once Express finishes sending the response, build and emit the log entry.
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;

    const logEntry = {
      timestamp:   new Date().toISOString(),
      method:      req.method,
      path:        req.originalUrl,
      userId:      req.userId   || 'anonymous',
      userRole:    req.userRole || 'public',
      statusCode:  res.statusCode,
      durationMs,
      destination: req.proxyDestination || 'gateway',
    };

    // console.log outputs to stdout — pipe to a log shipper in production.
    console.log(JSON.stringify(logEntry));
  });

  next();
}
```
