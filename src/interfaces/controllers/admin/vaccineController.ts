import { Request, Response } from "express";
import { VaccineModel } from "../../../infrastructure/database/models/vaccineModel";

export async function createVaccineController(req: Request, res: Response) {
  try {
    const vaccine = new VaccineModel(req.body);
    const saved = await vaccine.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar vacina" });
  }
}
