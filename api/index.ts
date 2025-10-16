import express from 'express';
import mongoose from 'mongoose';
import { corsConfig } from '../src/config/cors';
import publicRoutes from '../src/interfaces/routes/publicRoutes';
import adminRoutes from '../src/interfaces/routes/adminRoutes';
import { setupSwagger } from '../src/config/swagger';
import { connectDatabase } from "../src/config/database";
import "dotenv/config";

import { correlationIdMiddleware, requestLoggingMiddleware, Logger } from '../src/middlewares/logging';
import { errorHandlingMiddleware, notFoundMiddleware, jsonErrorHandler } from '../src/middlewares/errorHandling';
import { securityHeaders, sanitizeRequest } from '../src/middlewares/security';

const app = express();
const logger = Logger.getInstance();

// Configure Express to trust proxy (required for Vercel)
app.set('trust proxy', 1);

// Middleware setup
app.use(correlationIdMiddleware);
app.use(securityHeaders);

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
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlingMiddleware);

// Initialize database connection
let isConnected = false;

async function initializeDatabase() {
  if (!isConnected && mongoose.connection.readyState !== 1) {
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
    // Set CORS headers before any processing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Initialize database only if needed
    await initializeDatabase();
    
    // Pass request to Express app
    app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVERLESS_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    });
  }
}