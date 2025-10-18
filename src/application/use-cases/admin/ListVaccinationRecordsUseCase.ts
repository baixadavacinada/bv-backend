import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export class ListVaccinationRecordsUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(filters?: {
    healthUnitId?: string;
    startDate?: Date;
    endDate?: Date;
    residentId?: string;
    vaccineId?: string;
  }): Promise<VaccinationRecord[]> {
    if (filters?.startDate && filters?.endDate) {
      return this.vaccinationRecordRepository.findByDateRange(filters.startDate, filters.endDate);
    }
    
    if (filters?.healthUnitId) {
      return this.vaccinationRecordRepository.findByHealthUnitId(filters.healthUnitId);
    }
    
    if (filters?.residentId) {
      return this.vaccinationRecordRepository.findByResidentId(filters.residentId);
    }
    
    if (filters?.vaccineId) {
      return this.vaccinationRecordRepository.findByVaccineId(filters.vaccineId);
    }
    
    return this.vaccinationRecordRepository.findAll();
  }
}