import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';

export function loginController(req: Request, res: Response) {
  const { username, password } = req.body;
  if (username !== 'admin' || password !== 'admin') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: username, role: 'admin' }, env.jwtSecret, { expiresIn: '1h' });
  res.json({ token });
}
