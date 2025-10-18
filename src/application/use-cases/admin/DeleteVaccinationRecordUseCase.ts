import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';

export class DeleteVaccinationRecordUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(id: string): Promise<boolean> {
    const existingRecord = await this.vaccinationRecordRepository.findById(id);
    
    if (!existingRecord) {
      return false;
    }

    await this.vaccinationRecordRepository.delete(id);
    return true;
  }
}