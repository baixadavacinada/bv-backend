import cors from 'cors';
import { env } from './env';

export const corsConfig = cors({
  origin: env.frontendUrl || '*',
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
});
