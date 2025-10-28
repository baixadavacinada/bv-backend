import { AppointmentRepository } from '../../../domain/repositories/AppointmentRepository';

export interface AppointmentStats {
  totalAppointments: number;
  scheduledAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageCompletionRate: number;
  appointmentsByHealthUnit: Array<{
    healthUnitId: string;
    healthUnitName?: string;
    count: number;
  }>;
  appointmentsByVaccine: Array<{
    vaccineId: string;
    vaccineName?: string;
    count: number;
  }>;
  appointmentsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export class GetAppointmentStatsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(startDate?: Date, endDate?: Date): Promise<AppointmentStats> {
    const appointments = await this.appointmentRepository.findByDateRange(
      startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;

    const averageCompletionRate = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100) 
      : 0;

    const healthUnitMap = new Map<string, number>();
    appointments.forEach(appointment => {
      const count = healthUnitMap.get(appointment.healthUnitId) || 0;
      healthUnitMap.set(appointment.healthUnitId, count + 1);
    });

    const appointmentsByHealthUnit = Array.from(healthUnitMap.entries()).map(([healthUnitId, count]) => ({
      healthUnitId,
      count
    }));

    const vaccineMap = new Map<string, number>();
    appointments.forEach(appointment => {
      const count = vaccineMap.get(appointment.vaccineId) || 0;
      vaccineMap.set(appointment.vaccineId, count + 1);
    });

    const appointmentsByVaccine = Array.from(vaccineMap.entries()).map(([vaccineId, count]) => ({
      vaccineId,
      count
    }));

    const monthMap = new Map<string, number>();
    appointments.forEach(appointment => {
      const month = appointment.scheduledDate.toISOString().slice(0, 7);
      const count = monthMap.get(month) || 0;
      monthMap.set(month, count + 1);
    });

    const appointmentsByMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalAppointments,
      scheduledAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      averageCompletionRate,
      appointmentsByHealthUnit,
      appointmentsByVaccine,
      appointmentsByMonth
    };
  }
}