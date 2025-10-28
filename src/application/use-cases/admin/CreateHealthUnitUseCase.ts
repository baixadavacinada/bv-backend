import { HealthUnitsRepository } from '../../../domain/repositories/HealthUnitsRepository';
import { HealthUnit } from '../../../domain/entities/HealthUnit';

interface CreateHealthUnitData {
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  operatingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  availableVaccines?: string[];
  geolocation?: {
    lat: number;
    lng: number;
  };
  isActive?: boolean;
  isFavorite?: boolean;
}

export class CreateHealthUnitUseCase {
  constructor(private healthUnitsRepository: HealthUnitsRepository) {}

  async execute(data: CreateHealthUnitData): Promise<HealthUnit> {
    if (!data.name || !data.address || !data.neighborhood || !data.city || !data.state || !data.zipCode) {
      throw new Error('Required fields: name, address, neighborhood, city, state, zipCode');
    }

    if (data.name.length < 3 || data.name.length > 200) {
      throw new Error('Name must be between 3 and 200 characters');
    }

    if (data.address.length < 10 || data.address.length > 500) {
      throw new Error('Address must be between 10 and 500 characters');
    }

    if (data.zipCode.length < 8 || data.zipCode.length > 9) {
      throw new Error('ZipCode must be valid (8-9 characters)');
    }

    const healthUnit: Omit<HealthUnit, '_id'> = {
      name: data.name.trim(),
      address: data.address.trim(),
      neighborhood: data.neighborhood.trim(),
      city: data.city.trim(),
      state: data.state.trim().toUpperCase(),
      zipCode: data.zipCode.replace(/\D/g, ''),
      phone: data.phone?.trim(),
      operatingHours: data.operatingHours,
      availableVaccines: data.availableVaccines || [],
      geolocation: data.geolocation,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isFavorite: data.isFavorite !== undefined ? data.isFavorite : false,
      createdAt: new Date()
    };

    return this.healthUnitsRepository.create(healthUnit);
  }
}