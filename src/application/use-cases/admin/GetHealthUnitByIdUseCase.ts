import { HealthUnitsRepository } from '../../../domain/repositories/HealthUnitsRepository';
import { HealthUnit } from '../../../domain/entities/HealthUnit';

export class GetHealthUnitByIdUseCase {
  constructor(private healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string): Promise<HealthUnit | null> {
    if (!id) {
      throw new Error('Health Unit ID is required');
    }

    return this.healthUnitsRepository.findById(id);
  }
}