import { NotificationRepository } from '../../../domain/repositories/NotificationRepository';

export class MarkNotificationAsReadUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(notificationId: string, userId: string): Promise<boolean> {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verificar se a notificação pertence ao usuário
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized: This notification does not belong to the user');
    }

    return this.notificationRepository.markAsRead(notificationId);
  }
}