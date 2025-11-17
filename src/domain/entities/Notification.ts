export interface Notification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment_reminder' | 'vaccine_available' | 'dose_due' | 'system_update' | 'general';
  channel: 'whatsapp' | 'push' | 'email' | 'in_app'; // Channel through which notification was sent
  isRead: boolean;
  data?: {
    appointmentId?: string;
    vaccineId?: string;
    healthUnitId?: string;
    actionUrl?: string;
  };
  scheduledFor?: Date; // For scheduled notifications
  sentAt?: Date;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'; // Track delivery status
  externalMessageId?: string; // ID from external service (Z-API)
  createdAt?: Date;
  updatedAt?: Date;
}