import express from 'express';
import { corsConfig } from './config/cors';
import publicRoutes from './interfaces/routes/publicRoutes';
import adminRoutes from './interfaces/routes/adminRoutes';
import { setupSwagger } from './config/swagger';
import { connectDatabase } from "./config/database";
import "dotenv/config";

import { correlationIdMiddleware, requestLoggingMiddleware, healthCheckMiddleware, Logger } from './middlewares/logging';
import { errorHandlingMiddleware, notFoundMiddleware, jsonErrorHandler } from './middlewares/errorHandling';
import { securityHeaders, generalRateLimit, sanitizeRequest } from './middlewares/security';

const app = express();
const PORT = process.env.PORT || 3000;
const logger = Logger.getInstance();

app.use(correlationIdMiddleware);
app.use(healthCheckMiddleware);
app.use(securityHeaders);
app.use(generalRateLimit); 

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(jsonErrorHandler);

app.use(corsConfig);

app.use(requestLoggingMiddleware);
app.use(sanitizeRequest); 

setupSwagger(app);

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlingMiddleware);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', new Error(String(reason)), { promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

connectDatabase().then(() => {
    app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`, {
            environment: process.env.NODE_ENV || 'development',
            port: PORT
        });
    });
}).catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
});
