import { HealthUnit } from "../entities/HealthUnit";

export interface HealthUnitsReadRepository {
  findAll(): Promise<HealthUnit[]>;
  findByCity(city: string): Promise<HealthUnit[]>;
}
