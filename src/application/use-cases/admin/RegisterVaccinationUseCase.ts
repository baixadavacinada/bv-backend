import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export class RegisterVaccinationUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(record: VaccinationRecord): Promise<VaccinationRecord> {
    return this.vaccinationRecordRepository.create(record);
  }
}
