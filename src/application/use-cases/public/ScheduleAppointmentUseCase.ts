import { AppointmentRepository } from '../../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../../domain/entities/Appointment';

export class ScheduleAppointmentUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(appointmentData: Appointment): Promise<Appointment> {
    const availableSlots = await this.appointmentRepository.findAvailableSlots(
      appointmentData.healthUnitId,
      appointmentData.scheduledDate
    );

    if (!availableSlots.includes(appointmentData.scheduledTime)) {
      throw new Error('Selected time slot is not available');
    }

    const existingAppointments = await this.appointmentRepository.findByResidentId(
      appointmentData.residentId
    );

    const hasActiveAppointment = existingAppointments.some(apt => 
      apt.vaccineId === appointmentData.vaccineId && 
      apt.status === 'scheduled' &&
      apt.isActive
    );

    if (hasActiveAppointment) {
      throw new Error('User already has an active appointment for this vaccine');
    }

    return this.appointmentRepository.create(appointmentData);
  }
}