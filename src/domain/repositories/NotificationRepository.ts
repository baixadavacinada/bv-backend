import { Notification } from "../entities/Notification";

export interface NotificationRepository {
  create(data: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string): Promise<Notification[]>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  findAll(filters?: any): Promise<Notification[]>;
  markAsRead(id: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
  findScheduledNotifications(date: Date): Promise<Notification[]>;
  updateDeliveryStatus(
    id: string,
    status: 'sent' | 'delivered' | 'failed' | 'read',
    externalMessageId?: string
  ): Promise<boolean>;
}