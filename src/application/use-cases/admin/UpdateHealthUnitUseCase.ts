import { HealthUnitsRepository } from '../../../domain/repositories/HealthUnitsRepository';
import { HealthUnit } from '../../../domain/entities/HealthUnit';

export class UpdateHealthUnitUseCase {
  constructor(private healthUnitsRepository: HealthUnitsRepository) {}

  async execute(id: string, data: Partial<HealthUnit>): Promise<HealthUnit | null> {
    if (!id) {
      throw new Error('Health Unit ID is required');
    }

    const existingHealthUnit = await this.healthUnitsRepository.findById(id);
    if (!existingHealthUnit) {
      throw new Error('Health Unit not found');
    }

    if (data.name !== undefined) {
      if (data.name.length < 3 || data.name.length > 200) {
        throw new Error('Name must be between 3 and 200 characters');
      }
      data.name = data.name.trim();
    }

    if (data.address !== undefined) {
      if (data.address.length < 10 || data.address.length > 500) {
        throw new Error('Address must be between 10 and 500 characters');
      }
      data.address = data.address.trim();
    }

    if (data.zipCode !== undefined) {
      const cleanZipCode = data.zipCode.replace(/\D/g, '');
      if (cleanZipCode.length < 8 || cleanZipCode.length > 9) {
        throw new Error('ZipCode must be valid (8-9 characters)');
      }
      data.zipCode = cleanZipCode;
    }

    if (data.state !== undefined) {
      data.state = data.state.trim().toUpperCase();
    }

    if (data.neighborhood !== undefined) {
      data.neighborhood = data.neighborhood.trim();
    }

    if (data.city !== undefined) {
      data.city = data.city.trim();
    }

    if (data.phone !== undefined) {
      data.phone = data.phone.trim();
    }

    return this.healthUnitsRepository.update(id, data);
  }
}