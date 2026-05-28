// middleware/logger.js
// TODO-3: Structured Request Logging
//
// This middleware attaches to every request and logs a structured entry
// AFTER the response has been sent (using res.on('finish')).
//
// Why 'finish'?
//   Because we need the final status code and total duration.
//   Listening to 'finish' means logging never blocks the response — it fires
//   after Express has already sent bytes back to the client.
//
// Output format: JSON to stdout.
//   JSON logs are easily consumed by log aggregators (Datadog, Loki, CloudWatch, etc.)

/**
 * Builds a structured log entry and writes it to stdout as JSON.
 *
 * Fields logged:
 *   - timestamp    : ISO 8601 string
 *   - method       : HTTP verb (GET, POST, …)
 *   - path         : requested URL path (with query string)
 *   - userId       : from the decoded JWT payload (or 'anonymous' for public routes)
 *   - userRole     : from the decoded JWT payload (or 'public')
 *   - statusCode   : final HTTP status sent to the client
 *   - durationMs   : total gateway processing time in milliseconds
 *   - destination  : which downstream service was targeted (set by router)
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
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

export default requestLogger;
