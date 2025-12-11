import { v4 as uuidv4 } from 'uuid';
import { NotificationAuditRepository } from '../../../domain/repositories/NotificationAuditRepository';
import { NotificationAudit, CreateAuditDTO, AuditFilters, AuditStats, AuditAction, AuditChannel } from '../../../domain/entities/NotificationAudit';
import { NotificationAuditModel } from '../models/notificationAuditModel';
import { convertLeanDocumentToString } from '../utils/mongoUtils';

export class MongoNotificationAuditRepository implements NotificationAuditRepository {
  async create(data: CreateAuditDTO): Promise<NotificationAudit> {
    const audit: Omit<NotificationAudit, '_id'> = {
      id: uuidv4(),
      ...data,
      performedAt: new Date()
    };

    const created = await NotificationAuditModel.create(audit);
    return this.toEntity(created);
  }

  async createMany(data: CreateAuditDTO[]): Promise<NotificationAudit[]> {
    const audits = data.map(item => ({
      id: uuidv4(),
      ...item,
      performedAt: new Date()
    }));

    const created = await NotificationAuditModel.insertMany(audits);
    return created.map(this.toEntity);
  }

  async findById(id: string): Promise<NotificationAudit | null> {
    const audit = await NotificationAuditModel.findOne({ id }).lean();
    return audit ? this.toEntity(audit) : null;
  }

  async findAll(
    filters?: AuditFilters,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    data: NotificationAudit[];
    total: number;
    hasMore: boolean;
  }> {
    const query: any = {};

    if (filters?.action) query.action = filters.action;
    if (filters?.entityType) query.entityType = filters.entityType;
    if (filters?.entityId) query.entityId = filters.entityId;
    if (filters?.templateId) query.templateId = filters.templateId;
    if (filters?.jobId) query.jobId = filters.jobId;
    if (filters?.recipientId) query.recipientId = filters.recipientId;
    if (filters?.channel) query.channel = filters.channel;
    if (filters?.success !== undefined) query.success = filters.success;
    if (filters?.performedBy) query.performedBy = filters.performedBy;

    if (filters?.startDate || filters?.endDate) {
      query.performedAt = {};
      if (filters.startDate) query.performedAt.$gte = filters.startDate;
      if (filters.endDate) query.performedAt.$lte = filters.endDate;
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'performedAt';
    const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

    const [audits, total] = await Promise.all([
      NotificationAuditModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(offset)
        .lean(),
      NotificationAuditModel.countDocuments(query)
    ]);

    return {
      data: audits.map(this.toEntity),
      total,
      hasMore: offset + limit < total
    };
  }

  async findByTemplate(templateId: string, limit: number = 50): Promise<NotificationAudit[]> {
    const audits = await NotificationAuditModel.find({ templateId })
      .sort({ performedAt: -1 })
      .limit(limit)
      .lean();

    return audits.map(this.toEntity);
  }

  async findByJob(jobId: string, limit: number = 100): Promise<NotificationAudit[]> {
    const audits = await NotificationAuditModel.find({ jobId })
      .sort({ performedAt: -1 })
      .limit(limit)
      .lean();

    return audits.map(this.toEntity);
  }

  async findByRecipient(recipientId: string, limit: number = 50): Promise<NotificationAudit[]> {
    const audits = await NotificationAuditModel.find({ recipientId })
      .sort({ performedAt: -1 })
      .limit(limit)
      .lean();

    return audits.map(this.toEntity);
  }

  async getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    templateId?: string;
    performedBy?: string;
  }): Promise<AuditStats> {
    const matchQuery: any = {};

    if (filters?.templateId) matchQuery.templateId = filters.templateId;
    if (filters?.performedBy) matchQuery.performedBy = filters.performedBy;
    if (filters?.startDate || filters?.endDate) {
      matchQuery.performedAt = {};
      if (filters.startDate) matchQuery.performedAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.performedAt.$lte = filters.endDate;
    }

    const [aggregateStats, recentActivity] = await Promise.all([
      NotificationAuditModel.aggregate([
        { $match: matchQuery },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalActions: { $sum: 1 },
                  successCount: {
                    $sum: { $cond: ['$success', 1, 0] }
                  }
                }
              }
            ],
            byAction: [
              {
                $group: {
                  _id: '$action',
                  count: { $sum: 1 }
                }
              }
            ],
            byChannel: [
              {
                $match: { channel: { $exists: true } }
              },
              {
                $group: {
                  _id: '$channel',
                  count: { $sum: 1 }
                }
              }
            ],
            byTemplate: [
              {
                $match: { templateId: { $exists: true } }
              },
              {
                $group: {
                  _id: {
                    templateId: '$templateId',
                    templateName: '$templateName'
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]),
      NotificationAuditModel.find(matchQuery)
        .sort({ performedAt: -1 })
        .limit(20)
        .lean()
    ]);

    const stats = aggregateStats[0];
    const totals = stats.totals[0] || { totalActions: 0, successCount: 0 };

    const byAction = stats.byAction.reduce((acc: Record<AuditAction, number>, item: any) => {
      acc[item._id as AuditAction] = item.count;
      return acc;
    }, {} as Record<AuditAction, number>);

    const byChannel = stats.byChannel.reduce((acc: Record<AuditChannel, number>, item: any) => {
      acc[item._id as AuditChannel] = item.count;
      return acc;
    }, {} as Record<AuditChannel, number>);

    const byTemplate = stats.byTemplate.map((item: any) => ({
      templateId: item._id.templateId,
      templateName: item._id.templateName || 'Unknown',
      count: item.count
    }));

    const successRate = totals.totalActions > 0
      ? (totals.successCount / totals.totalActions) * 100
      : 0;

    return {
      totalActions: totals.totalActions,
      successRate,
      byAction,
      byChannel,
      byTemplate,
      recentActivity: recentActivity.map(this.toEntity)
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await NotificationAuditModel.deleteMany({
      performedAt: { $lt: date }
    });
    return result.deletedCount;
  }

  private toEntity(doc: any): NotificationAudit {
    return convertLeanDocumentToString<NotificationAudit>(doc);
  }
}
