export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  _id?: string;
  residentId: string;
  vaccineId: string;
  healthUnitId: string;
  scheduledDate: Date;
  scheduledTime: string; // HH:MM format
  dose: '1ª dose' | '2ª dose' | '3ª dose' | 'dose única' | 'reforço';
  status: AppointmentStatus;
  notes?: string;
  confirmedBy?: string; // Agent who confirmed
  completedBy?: string; // Agent who completed vaccination
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}