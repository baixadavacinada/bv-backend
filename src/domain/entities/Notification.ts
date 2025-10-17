export interface Notification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment_reminder' | 'vaccine_available' | 'dose_due' | 'system_update' | 'general';
  isRead: boolean;
  data?: {
    appointmentId?: string;
    vaccineId?: string;
    healthUnitId?: string;
    actionUrl?: string;
  };
  scheduledFor?: Date; // For scheduled notifications
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}