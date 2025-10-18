import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export class GetVaccinationRecordByIdUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(id: string): Promise<VaccinationRecord | null> {
    return this.vaccinationRecordRepository.findById(id);
  }
}