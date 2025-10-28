import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from "../src/config/database";
import publicRoutes from '../src/interfaces/routes/publicRoutes';
import adminRoutes from '../src/interfaces/routes/adminRoutes';
import { setupApiDocs } from '../src/config/scalar';
import "dotenv/config";

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

setupApiDocs(app);

app.get('/api/api-docs', (req, res) => {
  res.redirect(301, '/api-docs');
});

app.get('/api/api-docs.json', (req, res) => {
  res.redirect(301, '/api-docs.json');
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Baixada Vacinada API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Baixada Vacinada API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

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

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '*';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  try {
    await initializeDatabase();
    
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