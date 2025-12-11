/**
 * MongoDB Implementation of NotificationJobRepository
 */

import { v4 as uuidv4 } from 'uuid';
import { NotificationJobRepository } from '../../../domain/repositories/NotificationJobRepository';
import { NotificationJob, NotificationJobFilters, CreateNotificationJobDTO, JobStatus } from '../../../domain/entities/NotificationJob';
import { NotificationJobModel } from '../models/notificationJobModel';
import { convertLeanDocumentToString } from '../utils/mongoUtils';

export class MongoNotificationJobRepository implements NotificationJobRepository {
  async create(data: CreateNotificationJobDTO): Promise<NotificationJob> {
    const job: Omit<NotificationJob, '_id'> = {
      id: uuidv4(),
      templateId: data.templateId,
      templateName: '', // Will be populated by use case
      type: data.scheduledFor ? 'scheduled' : data.recurrence ? 'recurring' : 'immediate',
      status: 'pending',
      recipients: [], // Will be populated by use case
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      context: data.context,
      scheduledFor: data.scheduledFor,
      recurrence: data.recurrence,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobErrors: []
    };

    const created = await NotificationJobModel.create(job);
    return this.toEntity(created);
  }

  async findById(id: string): Promise<NotificationJob | null> {
    const job = await NotificationJobModel.findOne({ id }).lean();
    return job ? this.toEntity(job) : null;
  }

  async findAll(filters?: NotificationJobFilters): Promise<NotificationJob[]> {
    const query: any = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    if (filters?.templateId) query.templateId = filters.templateId;
    if (filters?.createdBy) query.createdBy = filters.createdBy;
    
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const jobs = await NotificationJobModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return jobs.map(this.toEntity);
  }

  async findPendingJobs(): Promise<NotificationJob[]> {
    const jobs = await NotificationJobModel.find({
      status: 'pending',
      $or: [
        { scheduledFor: { $exists: false } },
        { scheduledFor: { $lte: new Date() } }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    return jobs.map(this.toEntity);
  }

  async findScheduledJobs(before: Date): Promise<NotificationJob[]> {
    const jobs = await NotificationJobModel.find({
      status: 'pending',
      type: { $in: ['scheduled', 'recurring'] },
      scheduledFor: { $lte: before }
    })
      .sort({ scheduledFor: 1 })
      .lean();

    return jobs.map(this.toEntity);
  }

  async updateStatus(id: string, status: JobStatus): Promise<NotificationJob | null> {
    const updated = await NotificationJobModel.findOneAndUpdate(
      { id },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).lean();

    return updated ? this.toEntity(updated) : null;
  }

  async updateProgress(id: string, data: {
    successCount?: number;
    failureCount?: number;
    startedAt?: Date;
    completedAt?: Date;
    status?: JobStatus;
  }): Promise<NotificationJob | null> {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (data.successCount !== undefined) updateData.successCount = data.successCount;
    if (data.failureCount !== undefined) updateData.failureCount = data.failureCount;
    if (data.startedAt) updateData.startedAt = data.startedAt;
    if (data.completedAt) updateData.completedAt = data.completedAt;
    if (data.status) updateData.status = data.status;

    const updated = await NotificationJobModel.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    ).lean();

    return updated ? this.toEntity(updated) : null;
  }

  async updateRecipientStatus(jobId: string, recipientId: string, data: {
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
    messageId?: string;
  }): Promise<void> {
    const updateData: any = {
      'recipients.$.status': data.status,
      updatedAt: new Date()
    };

    if (data.sentAt) updateData['recipients.$.sentAt'] = data.sentAt;
    if (data.error) updateData['recipients.$.error'] = data.error;
    if (data.messageId) updateData['recipients.$.messageId'] = data.messageId;

    await NotificationJobModel.updateOne(
      { id: jobId, 'recipients.userId': recipientId },
      { $set: updateData }
    );
  }

  async addError(jobId: string, error: {
    recipientId: string;
    error: string;
    timestamp: Date;
  }): Promise<void> {
    await NotificationJobModel.updateOne(
      { id: jobId },
      { 
        $push: { jobErrors: error },
        $set: { updatedAt: new Date() }
      }
    );
  }

  async cancel(id: string): Promise<NotificationJob | null> {
    const updated = await NotificationJobModel.findOneAndUpdate(
      { id },
      { 
        $set: { 
          status: 'cancelled',
          completedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { new: true }
    ).lean();

    return updated ? this.toEntity(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await NotificationJobModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getStats(filters?: { 
    startDate?: Date; 
    endDate?: Date; 
    templateId?: string 
  }): Promise<{
    total: number;
    byStatus: Record<JobStatus, number>;
    successRate: number;
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
  }> {
    const matchQuery: any = {};
    
    if (filters?.templateId) matchQuery.templateId = filters.templateId;
    if (filters?.startDate || filters?.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }

    const stats = await NotificationJobModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalRecipients: { $sum: '$totalRecipients' },
          totalSent: { $sum: '$successCount' },
          totalFailed: { $sum: '$failureCount' },
          byStatus: {
            $push: '$status'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        byStatus: {} as Record<JobStatus, number>,
        successRate: 0,
        totalRecipients: 0,
        totalSent: 0,
        totalFailed: 0
      };
    }

    const result = stats[0];
    const byStatus = (result.byStatus as JobStatus[]).reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<JobStatus, number>);

    const successRate = result.totalRecipients > 0
      ? (result.totalSent / result.totalRecipients) * 100
      : 0;

    return {
      total: result.total,
      byStatus,
      successRate,
      totalRecipients: result.totalRecipients,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed
    };
  }

  private toEntity(doc: any): NotificationJob {
    return convertLeanDocumentToString<NotificationJob>(doc);
  }
}
