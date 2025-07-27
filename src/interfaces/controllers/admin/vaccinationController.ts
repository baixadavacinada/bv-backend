import { Request, Response } from 'express';

export function vaccinationController(req: Request, res: Response) {
  const record = req.body;
  res.status(201).json({ message: 'Vaccination record created', record });
}
