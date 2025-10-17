import { Appointment } from "../entities/Appointment";

export interface AppointmentRepository {
  create(data: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findAll(): Promise<Appointment[]>;
  findByResidentId(residentId: string): Promise<Appointment[]>;
  findByHealthUnitId(healthUnitId: string): Promise<Appointment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment | null>;
  delete(id: string): Promise<boolean>;
  findAvailableSlots(healthUnitId: string, date: Date): Promise<string[]>;
}