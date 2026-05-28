import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
// @ts-ignore - Temporary until catalog-db is fully wired
import productRouter from './routes/products';
import adminProductRouter from './routes/adminProducts';
import uploadRouter from './routes/uploads';
import type { ErrorRequestHandler } from 'express';
import { connectMongoDB } from '@jhaz-imprints/catalog-db';
import { getMongoDBConnection } from '@jhaz-imprints/catalog-db/connection';
import { AppError, isAppError } from './errors/AppError';


dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
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

// Mount routes
app.use('/api/v1/products', productRouter);
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

async function startServer() {
    try {
        await connectMongoDB();
        console.log('✅ Catalog DB connected successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Catalog Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start Catalog Service:', error);
        process.exit(1);
    }
}

startServer();
