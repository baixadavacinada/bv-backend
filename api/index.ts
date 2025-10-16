import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import "dotenv/config";

const app = express();

// Configure Express to trust proxy (required for Vercel)
app.set('trust proxy', 1);

// Basic middleware
app.use(cors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Import routes only when needed to avoid initialization timeout
app.use('/api/public', async (req, res, next) => {
  try {
    const { default: publicRoutes } = await import('../src/interfaces/routes/publicRoutes');
    publicRoutes(req, res, next);
  } catch (error) {
    console.error('Error loading public routes:', error);
    res.status(500).json({ success: false, error: 'Route loading failed' });
  }
});

app.use('/api/admin', async (req, res, next) => {
  try {
    const { default: adminRoutes } = await import('../src/interfaces/routes/adminRoutes');
    adminRoutes(req, res, next);
  } catch (error) {
    console.error('Error loading admin routes:', error);
    res.status(500).json({ success: false, error: 'Route loading failed' });
  }
});

// 404 handler
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

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
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
      const { connectDatabase } = await import("../src/config/database");
      await connectDatabase();
      isConnected = true;
      console.log('Database connected for serverless function');
    } catch (error) {
      console.error('Failed to connect database:', error);
      throw error;
    }
  }
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  
  try {
    // Handle preflight requests quickly
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).end();
    }

    // For root path, respond immediately without database
    if (req.url === '/' && req.method === 'GET') {
      return res.json({
        success: true,
        message: 'Baixada Vacinada API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        initTime: Date.now() - startTime
      });
    }

    // Initialize database only for non-root requests
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
        timestamp: new Date().toISOString(),
        initTime: Date.now() - startTime
      }
    });
  }
}