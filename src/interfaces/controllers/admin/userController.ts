import { Request, Response } from "express";
import { UserModel } from "../../../infrastructure/database/models/userModel";

export async function createUserController(req: Request, res: Response) {
  try {
    const user = new UserModel(req.body);
    const saved = await user.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}
