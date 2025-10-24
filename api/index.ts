import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { connectDatabase } from "../src/config/database";
import publicRoutes from '../src/interfaces/routes/publicRoutes';
import adminRoutes from '../src/interfaces/routes/adminRoutes';
import { setupApiDocs } from '../src/config/scalar';
import "dotenv/config";

const app = express();

// Configure Express to trust proxy (required for Vercel)
app.set('trust proxy', 1);

// Basic middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow production frontend URLs
    const allowedOrigins = [
      'https://baixada-vacinada.vercel.app',
      'https://baixadavacinada.com.br',
      'https://www.baixadavacinada.com.br'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    return callback(null, true); // Allow all for now
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup API documentation
setupApiDocs(app);

// Simple health check route
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

// Simple 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Simple error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error.message || error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

// Database connection state
let isConnected = false;

async function initializeDatabase() {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
      isConnected = true;
      console.log('Database connected');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    // Handle preflight requests quickly
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin;
      
      // Set CORS headers for preflight
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      return res.status(200).end();
    }

    // Set CORS headers for all requests
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Initialize database
    await initializeDatabase();
    
    // Pass request to Express app
    app(req, res);
  } catch (error) {
    console.error('Serverless error:', error);
    
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