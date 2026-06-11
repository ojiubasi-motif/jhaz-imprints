import express from 'express';
// CORS is NOT configured here — this service is internal only (gateway handles CORS).
import helmet from 'helmet';
import dotenv from 'dotenv';
// @ts-ignore - Temporary until catalog-db is fully wired
import productRouter from './routes/products';
import adminProductRouter from './routes/adminProducts';
import uploadRouter from './routes/uploads';
import categoryRouter from './routes/categories';
import adminCategoryRouter from './routes/adminCategories';
import fabricRouter from './routes/fabrics';
import adminFabricRouter from './routes/adminFabrics';
import type { ErrorRequestHandler } from 'express';
import { connectMongoDB } from '@jhaz-imprints/catalog-db';
import { getMongoDBConnection } from '@jhaz-imprints/catalog-db/connection';
import { AppError, isAppError } from './errors/AppError';


dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());

// app.get('/health', (req, res) => {
//     res.status(200).json({ status: 'ok', service: 'catalog-service' });
// });
app.get('/health', (req, res) => {
  try {
    const conn = getMongoDBConnection(); // throws if readyState !== 1
    res.json({
      status: 'ok',
      mongo: 'connected',
      readyState: conn.readyState
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      mongo: 'disconnected'
    });
  }
});

import { verifyGatewayOrigin } from './middleware/authenticate';

// Mount gateway origin verification middleware globally
app.use(verifyGatewayOrigin);

// Mount routes
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/fabrics', fabricRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/admin/categories', adminCategoryRouter);
app.use('/api/v1/admin/fabrics', adminFabricRouter);
app.use('/api/v1/admin/products', adminProductRouter);
app.use('/api/v1/admin/uploads', uploadRouter);

// 404 catch-all — must come after all routes
app.use((_req, res) => {
  res.status(404).json({
    msg: 'Route not found',
    data: null,
    type: 'NOT_FOUND',
    code: 404,
  });
});

// Global error handler — must have 4 params for Express to recognise it
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      msg: err.message,
      data: null,
      type: err.code ?? 'ERROR',
      code: err.statusCode,
    });
  }

  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    msg: 'Internal server error',
    data: null,
    type: 'INTERNAL_ERROR',
    code: 500,
  });
};

app.use(errorHandler);

const PORT = process.env.PORT || 4001;

let server: ReturnType<typeof app.listen>;

async function startServer() {
    try {
        await connectMongoDB();
        console.log('✅ Catalog DB connected successfully');

        server = app.listen(PORT, () => {
            console.log(`🚀 Catalog Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start Catalog Service:', error);
        process.exit(1);
    }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Railway sends SIGTERM on deploy/restart.
async function gracefulShutdown(signal: string) {
    console.log(`[CatalogService] ${signal} received — shutting down gracefully...`);
    if (server) {
        server.close(() => {
            console.log('[CatalogService] HTTP server closed.');
        });
    }
    try {
        const { disconnectMongoDB } = await import('@jhaz-imprints/catalog-db');
        await disconnectMongoDB();
    } catch { /* already disconnected */ }
    try {
        const { redisPublisher } = await import('./redis');
        await redisPublisher.quit();
    } catch { /* redis may not be connected */ }
    console.log('[CatalogService] All connections closed. Exiting.');
    process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
