import { HealthUnitsRepository } from '../../../domain/repositories/HealthUnitsRepository';

export class DeleteHealthUnitUseCase {
  constructor(private healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Health Unit ID is required');
    }

    // Check if health unit exists
    const existingHealthUnit = await this.healthUnitsRepository.findById(id);
    if (!existingHealthUnit) {
      throw new Error('Health Unit not found');
    }

    // Soft delete - mark as inactive
    return this.healthUnitsRepository.delete(id);
  }
}