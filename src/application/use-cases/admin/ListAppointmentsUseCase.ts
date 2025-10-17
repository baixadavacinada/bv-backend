import { AppointmentRepository } from '../../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../../domain/entities/Appointment';

export class ListAppointmentsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async executeByUser(userId: string): Promise<Appointment[]> {
    return this.appointmentRepository.findByResidentId(userId);
  }

  async executeByHealthUnit(healthUnitId: string): Promise<Appointment[]> {
    return this.appointmentRepository.findByHealthUnitId(healthUnitId);
  }

  async executeByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.appointmentRepository.findByDateRange(startDate, endDate);
  }

  async executeAll(): Promise<Appointment[]> {
    return this.appointmentRepository.findAll();
  }
}