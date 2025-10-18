import { NotificationRepository } from '../../../domain/repositories/NotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'appointment_reminder' | 'vaccine_available' | 'dose_due' | 'system_update' | 'general';
  data?: {
    appointmentId?: string;
    vaccineId?: string;
    healthUnitId?: string;
    actionUrl?: string;
  };
  scheduledFor?: Date;
}

export class CreateNotificationUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(data: CreateNotificationData): Promise<Notification> {
    if (!data.userId || !data.title || !data.message || !data.type) {
      throw new Error('Required fields: userId, title, message, type');
    }

    if (data.title.length < 3 || data.title.length > 200) {
      throw new Error('Title must be between 3 and 200 characters');
    }

    if (data.message.length < 10 || data.message.length > 1000) {
      throw new Error('Message must be between 10 and 1000 characters');
    }

    const notification: Omit<Notification, '_id'> = {
      userId: data.userId,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      data: data.data,
      isRead: false,
      createdAt: new Date(),
      scheduledFor: data.scheduledFor
    };

    return this.notificationRepository.create(notification);
  }
}