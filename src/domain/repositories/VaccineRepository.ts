import { Vaccine } from "../entities/Vaccine";

export interface VaccineRepository {
  create(data: Vaccine): Promise<Vaccine>;
  findById(id: string): Promise<Vaccine | null>;
  findAll(): Promise<Vaccine[]>;
  update(id: string, data: Partial<Vaccine>): Promise<Vaccine | null>;
  delete(id: string): Promise<boolean>;
}
