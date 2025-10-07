import { VaccinationRecord } from "../entities/VaccinationRecord";

export interface VaccinationRecordRepository {
  create(data: VaccinationRecord): Promise<VaccinationRecord>;
  findById(id: string): Promise<VaccinationRecord | null>;
  findAll(): Promise<VaccinationRecord[]>;
}
