import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export interface CreateVaccinationRecordRequest {
  residentId: string;
  vaccineId: string;
  healthUnitId: string;
  appliedBy: string;
  createdBy: string;
  dose: '1ª dose' | '2ª dose' | '3ª dose' | 'dose única' | 'reforço';
  date: Date;
  notes?: string;
}

export class CreateVaccinationRecordUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(data: CreateVaccinationRecordRequest): Promise<VaccinationRecord> {
    const vaccinationRecord: VaccinationRecord = {
      residentId: data.residentId,
      vaccineId: data.vaccineId,
      healthUnitId: data.healthUnitId,
      appliedBy: data.appliedBy,
      createdBy: data.createdBy,
      dose: data.dose,
      date: data.date,
      notes: data.notes,
      isActive: true,
      createdAt: new Date()
    };

    return this.vaccinationRecordRepository.create(vaccinationRecord);
  }
}