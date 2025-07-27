import dotenv from 'dotenv';
dotenv.config();
export const env = {
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL,
  jwtSecret: process.env.JWT_SECRET || 'changeme'
};
