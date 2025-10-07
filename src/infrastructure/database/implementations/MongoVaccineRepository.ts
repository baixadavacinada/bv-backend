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
    const vaccines = await VaccineModel.find().lean();
    return convertLeanArrayToString<Vaccine>(vaccines);
  }
}
