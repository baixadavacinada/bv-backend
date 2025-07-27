import { VaccinationRepository } from '../../../domain/repositories/VaccinationRepository';

export class RegisterVaccinationUseCase {
  constructor(private vaccinationRepository: VaccinationRepository) {}

  async execute(record: any) {
    return this.vaccinationRepository.create(record);
  }
}
