import express from 'express';
import { corsConfig } from '../src/config/cors';
import publicRoutes from '../src/interfaces/routes/publicRoutes';
import adminRoutes from '../src/interfaces/routes/adminRoutes';
import { setupSwagger } from '../src/config/swagger';
import { connectDatabase } from "../src/config/database";
import "dotenv/config";

import { correlationIdMiddleware, requestLoggingMiddleware, healthCheckMiddleware, Logger } from '../src/middlewares/logging';
import { errorHandlingMiddleware, notFoundMiddleware, jsonErrorHandler } from '../src/middlewares/errorHandling';
import { securityHeaders, generalRateLimit, sanitizeRequest } from '../src/middlewares/security';

const app = express();
const logger = Logger.getInstance();

// Configure Express to trust proxy (required for Vercel)
app.set('trust proxy', 1);

// Middleware setup
app.use(correlationIdMiddleware);
app.use(healthCheckMiddleware);
app.use(securityHeaders);
// Temporarily disable rate limiting for Vercel debugging
// app.use(generalRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(jsonErrorHandler);

app.use(corsConfig);
app.use(requestLoggingMiddleware);
app.use(sanitizeRequest);

setupSwagger(app);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Baixada Vacinada API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/public', publicRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlingMiddleware);

// Initialize database connection
let isConnected = false;

async function initializeDatabase() {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
      logger.info('Database connected for serverless function');
    } catch (error) {
      logger.error('Failed to connect database in serverless function', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    await initializeDatabase();
    app(req, res);
  } catch (error) {
    logger.error('Serverless function error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVERLESS_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    });
  }
}