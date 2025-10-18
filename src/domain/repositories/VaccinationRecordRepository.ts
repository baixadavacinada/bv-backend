import { VaccinationRecord } from "../entities/VaccinationRecord";

export interface VaccinationRecordRepository {
  create(data: VaccinationRecord): Promise<VaccinationRecord>;
  findById(id: string): Promise<VaccinationRecord | null>;
  findAll(): Promise<VaccinationRecord[]>;
  findByResidentId(residentId: string): Promise<VaccinationRecord[]>;
  findByVaccineId(vaccineId: string): Promise<VaccinationRecord[]>;
  findByHealthUnitId(healthUnitId: string): Promise<VaccinationRecord[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<VaccinationRecord[]>;
  update(id: string, data: Partial<VaccinationRecord>): Promise<VaccinationRecord | null>;
  delete(id: string): Promise<boolean>;
}
