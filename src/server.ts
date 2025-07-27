import express from 'express';
import { corsConfig } from './config/cors';
import publicRoutes from './interfaces/routes/publicRoutes';
import adminRoutes from './interfaces/routes/adminRoutes';
import { authMiddleware } from './middlewares/authMiddleware';
import { setupSwagger } from './config/swagger';

const app = express();
app.use(express.json());
app.use(corsConfig);

// Swagger docs
setupSwagger(app);

app.use('/api/public', publicRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
