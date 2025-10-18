import { Notification } from "../../../domain/entities/Notification";
import { NotificationRepository } from "../../../domain/repositories/NotificationRepository";
import { NotificationModel } from "../models/notificationModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoNotificationRepository implements NotificationRepository {
  async create(data: Notification): Promise<Notification> {
    const created = await NotificationModel.create(data);
    return convertObjectIdToString<typeof created, Notification>(created);
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await NotificationModel.findById(id).lean();
    return notification ? convertLeanDocumentToString<Notification>(notification) : null;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 notifications
      .lean();
    return convertLeanArrayToString<Notification>(notifications);
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ 
      userId, 
      isRead: false 
    })
      .sort({ createdAt: -1 })
      .lean();
    return convertLeanArrayToString<Notification>(notifications);
  }

  async findAll(filters?: any): Promise<Notification[]> {
    const query: any = {};
    
    if (filters?.userId) {
      query.userId = filters.userId;
    }
    
    if (filters?.isRead !== undefined) {
      query.isRead = filters.isRead;
    }
    
    if (filters?.type) {
      query.type = filters.type;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit for admin view
      .lean();
    return convertLeanArrayToString<Notification>(notifications);
  }

  async markAsRead(id: string): Promise<boolean> {
    const result = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, updatedAt: new Date() }
    );
    return result.modifiedCount;
  }

  async delete(id: string): Promise<boolean> {
    const result = await NotificationModel.findByIdAndDelete(id);
    return !!result;
  }

  async findScheduledNotifications(date: Date): Promise<Notification[]> {
    const notifications = await NotificationModel.find({
      scheduledFor: { $lte: date },
      sentAt: { $exists: false }
    }).lean();
    return convertLeanArrayToString<Notification>(notifications);
  }
}