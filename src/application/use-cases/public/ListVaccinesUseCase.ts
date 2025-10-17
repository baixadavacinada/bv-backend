import { VaccineRepository } from '../../../domain/repositories/VaccineRepository';
import { Vaccine } from '../../../domain/entities/Vaccine';

export class ListVaccinesUseCase {
  constructor(private vaccineRepository: VaccineRepository) {}

  async execute(): Promise<Vaccine[]> {
    return this.vaccineRepository.findAll();
  }
}