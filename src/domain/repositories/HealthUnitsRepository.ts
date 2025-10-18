import { HealthUnit } from "../entities/HealthUnit";

export interface HealthUnitsRepository {
  create(data: HealthUnit): Promise<HealthUnit>;
  findById(id: string): Promise<HealthUnit | null>;
  findAll(filters?: any): Promise<HealthUnit[]>;
  update(id: string, data: Partial<HealthUnit>): Promise<HealthUnit | null>;
  delete(id: string): Promise<boolean>;
}
