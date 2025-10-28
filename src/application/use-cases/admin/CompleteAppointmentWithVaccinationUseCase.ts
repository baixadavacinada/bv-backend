import { AppointmentRepository } from '../../../domain/repositories/AppointmentRepository';
import { VaccinationRecordRepository } from '../../../domain/repositories/VaccinationRecordRepository';
import { Appointment } from '../../../domain/entities/Appointment';
import { VaccinationRecord } from '../../../domain/entities/VaccinationRecord';

export interface CompleteAppointmentWithVaccinationRequest {
  appointmentId: string;
  completedBy: string;
  appliedBy: string;
  vaccinationNotes?: string;
  reactions?: string;
  nextDoseDate?: Date;
}

export class CompleteAppointmentWithVaccinationUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private vaccinationRecordRepository: VaccinationRecordRepository
  ) {}

  async execute(data: CompleteAppointmentWithVaccinationRequest): Promise<{
    appointment: Appointment | null;
    vaccinationRecord: VaccinationRecord;
  }> {
    const appointment = await this.appointmentRepository.findById(data.appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status !== 'confirmed' && appointment.status !== 'scheduled') {
      throw new Error('Only confirmed or scheduled appointments can be completed');
    }

    const updatedAppointment = await this.appointmentRepository.update(data.appointmentId, {
      status: 'completed',
      completedBy: data.completedBy,
      notes: data.vaccinationNotes || appointment.notes,
      updatedBy: data.completedBy
    });

    const vaccinationRecord: VaccinationRecord = {
      residentId: appointment.residentId,
      vaccineId: appointment.vaccineId,
      healthUnitId: appointment.healthUnitId,
      appliedBy: data.appliedBy,
      createdBy: data.completedBy,
      dose: appointment.dose,
      date: new Date(),
      notes: data.vaccinationNotes,
      isActive: true,
      createdAt: new Date()
    };

    const createdVaccinationRecord = await this.vaccinationRecordRepository.create(vaccinationRecord);

    return {
      appointment: updatedAppointment,
      vaccinationRecord: createdVaccinationRecord
    };
  }
}