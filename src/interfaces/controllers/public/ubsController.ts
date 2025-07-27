import { Request, Response } from 'express';

export function listUbsController(req: Request, res: Response) {
  const ubsList = [
    { id: 1, name: 'UBS Centro', city: 'Japeri' },
    { id: 2, name: 'UBS Engenheiro Pedreira', city: 'Japeri' }
  ];
  res.json(ubsList);
}
