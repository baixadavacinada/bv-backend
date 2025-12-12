import { NotificationRepository } from '../../../domain/repositories/NotificationRepository';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { Notification } from '../../../domain/entities/Notification';
import { NotificationGateway } from '../../../services/notificationGateway';
import { Logger } from '../../../middlewares/logging';

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'appointment_reminder' | 'vaccine_available' | 'dose_due' | 'system_update' | 'general';
  channel?: 'whatsapp' | 'push' | 'email' | 'in_app'; // Default: in_app
  data?: {
    appointmentId?: string;
    vaccineId?: string;
    healthUnitId?: string;
    actionUrl?: string;
  };
  scheduledFor?: Date;
}

export class CreateNotificationUseCase {
  private logger = Logger.getInstance();
  private notificationGateway = new NotificationGateway();

  constructor(
    private notificationRepository: NotificationRepository,
    private userRepository?: UserRepository
  ) {}

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

    const channel = data.channel || 'in_app';

    const notification: Omit<Notification, '_id'> = {
      userId: data.userId,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      channel,
      data: data.data,
      isRead: false,
      deliveryStatus: 'pending',
      createdAt: new Date(),
      scheduledFor: data.scheduledFor
    };

    const savedNotification = await this.notificationRepository.create(notification);

    if (data.scheduledFor && new Date(data.scheduledFor) > new Date()) {
      this.logger.info('Notification scheduled for future delivery', {
        notificationId: savedNotification._id,
        scheduledFor: data.scheduledFor
      });
      return savedNotification;
    }

    if (channel !== 'in_app') {
      await this.sendNotification(savedNotification);
    }

    return savedNotification;
  }

  private async sendNotification(notification: Notification): Promise<void> {
    try {
      let contactInfo: string | null = null;

      if (this.userRepository) {
        try {
          const user = await this.userRepository.findById(notification.userId);
          if (!user) {
            this.logger.error('User not found for notification', undefined, {
              userId: notification.userId,
              notificationId: notification._id
            });
            await this.updateNotificationStatus(notification._id!, 'failed');
            return;
          }

          if (notification.channel === 'whatsapp' && user.phone) {
            contactInfo = user.phone;
          } else if (notification.channel === 'email' && user.email) {
            contactInfo = user.email;
          }
        } catch (error) {
          this.logger.error('Failed to fetch user data', error as Error, {
            userId: notification.userId
          });
        }
      }

      if (!contactInfo) {
        this.logger.warn('No contact info available for notification', {
          channel: notification.channel,
          userId: notification.userId,
          notificationId: notification._id
        });
        await this.updateNotificationStatus(notification._id!, 'failed');
        return;
      }
      const result = await this.notificationGateway.send({
        channel: notification.channel,
        to: contactInfo,
        title: notification.title,
        message: notification.message
      });

      if (result.success) {
        await this.updateNotificationStatus(
          notification._id!,
          'sent',
          result.messageId
        );
        this.logger.info('Notification sent successfully', {
          notificationId: notification._id,
          channel: notification.channel,
          messageId: result.messageId
        });
      } else {
        await this.updateNotificationStatus(notification._id!, 'failed');
        this.logger.error('Failed to send notification', undefined, {
          notificationId: notification._id,
          channel: notification.channel,
          error: result.error
        });
      }
    } catch (error) {
      this.logger.error('Error in sendNotification', error as Error, {
        notificationId: notification._id,
        channel: notification.channel
      });
      await this.updateNotificationStatus(notification._id!, 'failed');
    }
  }
  private async updateNotificationStatus(
    notificationId: string,
    status: 'sent' | 'failed',
    externalMessageId?: string
  ): Promise<void> {
    try {
      await this.notificationRepository.updateDeliveryStatus(
        notificationId,
        status,
        externalMessageId
      );
    } catch (error) {
      this.logger.error('Failed to update notification status', error as Error, {
        notificationId,
        status
      });
    }
  }
}