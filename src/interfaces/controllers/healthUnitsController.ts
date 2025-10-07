import { Request, Response } from "express";
import { HealthUnitModel } from "../../infrastructure/database/models/healthUnitModel";

export async function createHealthUnitController(req: Request, res: Response) {
  try {
    const healthUnit = new HealthUnitModel(req.body);
    const saved = await healthUnit.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error creating health unit" });
  }
}

export async function listHealthUnitsController(req: Request, res: Response) {
  try {
    const { city, isActive, isFavorite, neighborhood } = req.query;
    const query: any = {};

    if (city) query.city = city;
    if (neighborhood) query.neighborhood = neighborhood;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isFavorite !== undefined) query.isFavorite = isFavorite === "true";

    const units = await HealthUnitModel.find(query);
    return res.status(200).json(units);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching units" });
  }
}

export async function getHealthUnitByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const unit = await HealthUnitModel.findById(id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    return res.status(200).json(unit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching unit" });
  }
}

export async function updateHealthUnitController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updated = await HealthUnitModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Unit not found" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating unit" });
  }
}

export async function toggleFavoriteController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;
    const updated = await HealthUnitModel.findByIdAndUpdate(
      id,
      { isFavorite },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Unit not found" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating favorite" });
  }
}

export async function toggleActiveController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await HealthUnitModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Unit not found" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating active status" });
  }
}

export async function toggleVisibilityController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const updated = await HealthUnitModel.findByIdAndUpdate(
      id,
      { isPublic },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Unidade não encontrada" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar visibilidade" });
  }
}
