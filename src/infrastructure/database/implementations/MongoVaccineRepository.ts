import { Vaccine } from "../../../domain/entities/Vaccine";
import { VaccineRepository } from "../../../domain/repositories/VaccineRepository";
import { VaccineModel } from "../models/vaccineModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoVaccineRepository implements VaccineRepository {
  async create(data: Vaccine): Promise<Vaccine> {
    const created = await VaccineModel.create(data);
    return convertObjectIdToString<typeof created, Vaccine>(created);
  }

  async findById(id: string): Promise<Vaccine | null> {
    const vaccine = await VaccineModel.findById(id).lean();
    return vaccine ? convertLeanDocumentToString<Vaccine>(vaccine) : null;
  }

  async findAll(): Promise<Vaccine[]> {
    const vaccines = await VaccineModel.find({ isActive: true }).sort({ name: 1 }).lean();
    return convertLeanArrayToString<Vaccine>(vaccines);
  }

  async update(id: string, data: Partial<Vaccine>): Promise<Vaccine | null> {
    const updated = await VaccineModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    return updated ? convertLeanDocumentToString<Vaccine>(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await VaccineModel.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }
}
