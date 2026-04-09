import express from 'express';
import { Express } from 'express';
import { corsConfig } from '../../src/config/cors';
import publicRoutes from '../../src/interfaces/routes/publicRoutes';
import authRoutes from '../../src/interfaces/routes/authRoutes';
import adminRoutes from '../../src/interfaces/routes/adminRoutes';
import { connectDatabase } from '../../src/config/database';
import { correlationIdMiddleware, requestLoggingMiddleware, healthCheckMiddleware } from '../../src/middlewares/logging';
import { errorHandlingMiddleware, notFoundMiddleware, jsonErrorHandler } from '../../src/middlewares/errorHandling';
import { securityHeaders, generalRateLimit, sanitizeRequest } from '../../src/middlewares/security';

export async function createTestApp(): Promise<Express> {
  const app = express();

  // Connect to test database
  await connectDatabase();

  // Basic middleware setup
  app.use(correlationIdMiddleware);
  app.use(healthCheckMiddleware);
  app.use(securityHeaders);
  
  // Disable rate limiting in tests for faster execution
  if (process.env.NODE_ENV !== 'test') {
    app.use(generalRateLimit);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(jsonErrorHandler);
  app.use(corsConfig);
  app.use(requestLoggingMiddleware);
  app.use(sanitizeRequest);

  // Mock auth middleware for tests
  app.use('/api', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer mock-')) {
      const token = authHeader.replace('Bearer mock-', '');
      if (token === 'firebase-user-token') {
        req.user = {
          id: 'google-test-user',
          email: 'test@example.com',
          role: 'public'
        };
      } else if (token === 'admin-global-token') {
        req.user = {
          id: 'admin-global-uid',
          email: 'admin-global@test.com',
          role: 'admin'
        };
      } else if (token === 'admin-unit-token') {
        req.user = {
          id: 'admin-unit-uid',
          email: 'admin-unit@test.com',
          role: 'admin'
        };
      } else if (token === 'agent-token') {
        req.user = {
          id: 'agent-uid',
          email: 'agent@test.com',
          role: 'agent'
        };
      }
    }
    next();
  });

  // Routes
  app.use('/api/public', publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check endpoints
  app.get('/', (req, res) => {
    res.status(200).json({ 
      success: true,
      message: 'Test API is running',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use(notFoundMiddleware);
  app.use(errorHandlingMiddleware);

  return app;
}

export async function closeTestApp(): Promise<void> {
  // Any cleanup needed for the test app
  // Database disconnection is handled in globalTeardown
}