# Style Guide: Database Connection

## Unique Conventions
- MongoDB connection uses exponential backoff retry (5 attempts, 1s base delay)
- Connection pooling: `maxPoolSize: 10`, `minPoolSize: 2`
- Module-level `connection` variable cached; `connectMongoDB()` returns existing if `readyState === 1`
- Exports: `connectMongoDB()`, `disconnectMongoDB()`, `getMongoDBConnection()`
- Prisma client singleton uses `globalThis` caching to prevent hot-reload connection leaks
- Prisma logging: `["query", "error", "warn"]` in development, `["error"]` in production
