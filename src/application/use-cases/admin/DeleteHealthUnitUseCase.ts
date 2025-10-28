import { HealthUnitsRepository } from '../../../domain/repositories/HealthUnitsRepository';

export class DeleteHealthUnitUseCase {
  constructor(private healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Health Unit ID is required');
    }

    const existingHealthUnit = await this.healthUnitsRepository.findById(id);
    if (!existingHealthUnit) {
      throw new Error('Health Unit not found');
    }

    return this.healthUnitsRepository.delete(id);
  }
}