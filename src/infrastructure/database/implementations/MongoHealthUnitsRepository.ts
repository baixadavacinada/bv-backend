import { HealthUnit } from "../../../domain/entities/HealthUnit";
import { HealthUnitsRepository } from "../../../domain/repositories/HealthUnitsRepository";
import { HealthUnitModel } from "../models/healthUnitModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoHealthUnitsRepository implements HealthUnitsRepository {
  async create(data: HealthUnit): Promise<HealthUnit> {
    const created = await HealthUnitModel.create(data);
    return convertObjectIdToString<typeof created, HealthUnit>(created);
  }

  async findById(id: string): Promise<HealthUnit | null> {
    const healthUnit = await HealthUnitModel.findById(id).lean();
    return healthUnit ? convertLeanDocumentToString<HealthUnit>(healthUnit) : null;
  }

  async findAll(filters?: any): Promise<HealthUnit[]> {
    const query: any = {};
    
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    
    if (filters?.isFavorite !== undefined) {
      query.isFavorite = filters.isFavorite;
    }
    
    if (filters?.neighborhood) {
      query.neighborhood = { $regex: filters.neighborhood, $options: 'i' };
    }
    
    if (filters?.city) {
      query.city = { $regex: filters.city, $options: 'i' };
    }
    
    if (filters?.state) {
      query.state = filters.state;
    }

    const healthUnits = await HealthUnitModel.find(query)
      .sort({ name: 1 })
      .lean();
    return convertLeanArrayToString<HealthUnit>(healthUnits);
  }

  async update(id: string, data: Partial<HealthUnit>): Promise<HealthUnit | null> {
    const updated = await HealthUnitModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).lean();
    return updated ? convertLeanDocumentToString<HealthUnit>(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete - just mark as inactive
    const result = await HealthUnitModel.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }
}