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
    const record = await VaccinationRecordModel.findById(id)
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .populate('appliedBy', 'name email')
      .lean();
    return record ? convertLeanDocumentToString<VaccinationRecord>(record) : null;
  }

  async findAll(): Promise<VaccinationRecord[]> {
    const records = await VaccinationRecordModel.find({ isActive: true })
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .populate('appliedBy', 'name email')
      .sort({ date: -1 })
      .lean();
    return convertLeanArrayToString<VaccinationRecord>(records);
  }

  async findByResidentId(residentId: string): Promise<VaccinationRecord[]> {
    const records = await VaccinationRecordModel.find({ 
      residentId, 
      isActive: true 
    })
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .populate('appliedBy', 'name email')
      .sort({ date: -1 })
      .lean();
    return convertLeanArrayToString<VaccinationRecord>(records);
  }

  async findByVaccineId(vaccineId: string): Promise<VaccinationRecord[]> {
    const records = await VaccinationRecordModel.find({ 
      vaccineId, 
      isActive: true 
    })
      .populate('residentId', 'name email')
      .populate('healthUnitId', 'name address')
      .populate('appliedBy', 'name email')
      .sort({ date: -1 })
      .lean();
    return convertLeanArrayToString<VaccinationRecord>(records);
  }

  async findByHealthUnitId(healthUnitId: string): Promise<VaccinationRecord[]> {
    const records = await VaccinationRecordModel.find({ 
      healthUnitId, 
      isActive: true 
    })
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('appliedBy', 'name email')
      .sort({ date: -1 })
      .lean();
    return convertLeanArrayToString<VaccinationRecord>(records);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<VaccinationRecord[]> {
    const records = await VaccinationRecordModel.find({
      date: { $gte: startDate, $lte: endDate },
      isActive: true
    })
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .populate('appliedBy', 'name email')
      .sort({ date: -1 })
      .lean();
    return convertLeanArrayToString<VaccinationRecord>(records);
  }

  async update(id: string, data: Partial<VaccinationRecord>): Promise<VaccinationRecord | null> {
    const updated = await VaccinationRecordModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .populate('appliedBy', 'name email')
      .lean();
    return updated ? convertLeanDocumentToString<VaccinationRecord>(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await VaccinationRecordModel.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }
}
