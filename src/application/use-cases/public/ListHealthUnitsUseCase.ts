import { HealthUnitsRepository } from '../../../domain/repositories/HealthUnitsRepository';
import { HealthUnit } from '../../../domain/entities/HealthUnit';

interface Location {
  latitude: number;
  longitude: number;
  maxDistanceKm: number;
}

interface ListHealthUnitsFilters {
  isActive?: boolean;
  isFavorite?: boolean;
  neighborhood?: string;
  city?: string;
  state?: string;
  location?: Location;
}

export class ListHealthUnitsUseCase {
  constructor(private healthUnitsRepository?: HealthUnitsRepository) {}

  async execute(filters: ListHealthUnitsFilters = {}): Promise<HealthUnit[]> {
    try {
      if (this.healthUnitsRepository) {
        // Use repository if provided (for admin use)
        return await this.healthUnitsRepository.findAll(filters);
      } else {
        // Fallback to direct model usage (for existing public use)
        const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');
        const query = this.buildQuery(filters);
        return await HealthUnitModel.find(query);
      }
    } catch (error) {
      this.logError(error);
      throw new Error('Erro ao buscar unidades de saúde no banco de dados');
    }
  }

  private buildQuery(filters: ListHealthUnitsFilters): Record<string, any> {
    const query: Record<string, any> = {};

    if (typeof filters.isActive === 'boolean') {
      query.isActive = filters.isActive;
    }

    if (typeof filters.isFavorite === 'boolean') {
      query.isFavorite = filters.isFavorite;
    }

    if (filters.neighborhood) {
      query.neighborhood = new RegExp(filters.neighborhood, 'i');
    }

    if (filters.city) {
      query.city = new RegExp(filters.city, 'i');
    }

    if (filters.state) {
      query.state = filters.state;
    }

    if (filters.location) {
      const { latitude, longitude, maxDistanceKm } = filters.location;

      query.geolocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceKm * 1000,
        },
      };
    }

    return query;
  }

  private logError(error: unknown): void {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Erro ao buscar unidades de saúde no banco de dados:', message);
  }
}
