import { VaccinationRecord } from "../../../domain/entities/VaccinationRecord";
import { VaccinationRecordRepository } from "../../../domain/repositories/VaccinationRecordRepository";
import { VaccinationRecordModel } from "../models/vaccinationRecordModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoVaccinationRecordRepository implements VaccinationRecordRepository {
  async create(data: VaccinationRecord): Promise<VaccinationRecord> {
    const created = await VaccinationRecordModel.create(data);
    return convertObjectIdToString<typeof created, VaccinationRecord>(created);
  }

  async findById(id: string): Promise<VaccinationRecord | null> {
    const record = await VaccinationRecordModel.findById(id).lean();
    return record ? convertLeanDocumentToString<VaccinationRecord>(record) : null;
  }

  async findAll(): Promise<VaccinationRecord[]> {
    const records = await VaccinationRecordModel.find().lean();
    return convertLeanArrayToString<VaccinationRecord>(records);
  }
}
