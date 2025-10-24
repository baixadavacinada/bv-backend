import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '*'),
  jwtSecret: process.env.JWT_SECRET || 'changeme',
  nodeEnv: process.env.NODE_ENV || 'development'
};
