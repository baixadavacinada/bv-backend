import { NotificationRepository } from '../../../domain/repositories/NotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

interface ListAllNotificationsFilters {
  userId?: string;
  isRead?: boolean;
  type?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ListAllNotificationsUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(filters?: ListAllNotificationsFilters): Promise<Notification[]> {
    return this.notificationRepository.findAll(filters);
  }
}