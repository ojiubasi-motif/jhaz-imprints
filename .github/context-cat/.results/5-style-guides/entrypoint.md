# Entrypoint Styleguide

## Unique Patterns
- **Health Check Database Connection Validation**: The `/health` route doesn't just return a 200 OK. It actively checks `getMongoDBConnection().readyState` and throws an HTTP 503 if the database is disconnected.
- **Top-level await prevention**: It uses a named `startServer()` async function that connects to MongoDB before calling `app.listen()`, ensuring the server refuses to accept connections before the database is ready.
