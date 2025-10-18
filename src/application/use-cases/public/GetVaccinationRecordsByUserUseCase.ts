import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export class GetVaccinationRecordsByUserUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(userId: string): Promise<VaccinationRecord[]> {
    return this.vaccinationRecordRepository.findByResidentId(userId);
  }
}