import { HealthUnit } from "../entities/HealthUnit";

export interface HealthUnitsRepository {
  create(data: HealthUnit): Promise<HealthUnit>;
  findById(id: string): Promise<HealthUnit | null>;
  findAll(): Promise<HealthUnit[]>;
}
