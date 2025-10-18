import { NotificationRepository } from '../../../domain/repositories/NotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

export class ListNotificationsUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(userId: string): Promise<Notification[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.notificationRepository.findByUserId(userId);
  }
}