import { HealthUnitModel } from '../../../infrastructure/database/models/healthUnitModel';

interface Location {
  latitude: number;
  longitude: number;
  maxDistanceKm: number;
}

interface ListHealthUnitsFilters {
  isActive?: boolean;
  isFavorite?: boolean;
  neighborhood?: string;
  location?: Location;
}

export class ListHealthUnitsUseCase {
  async execute(filters: ListHealthUnitsFilters = {}): Promise<any[]> {
    const query = this.buildQuery(filters);

    try {
      return await HealthUnitModel.find(query);
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
