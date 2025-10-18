import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export interface UpdateVaccinationRecordRequest {
  notes?: string;
  dose?: '1ª dose' | '2ª dose' | '3ª dose' | 'dose única' | 'reforço';
  date?: Date;
  updatedBy: string;
}

export class UpdateVaccinationRecordUseCase {
  constructor(private vaccinationRecordRepository: VaccinationRecordRepository) {}

  async execute(id: string, data: UpdateVaccinationRecordRequest): Promise<VaccinationRecord | null> {
    const existingRecord = await this.vaccinationRecordRepository.findById(id);
    
    if (!existingRecord) {
      return null;
    }

    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    return this.vaccinationRecordRepository.update(id, updateData);
  }
}