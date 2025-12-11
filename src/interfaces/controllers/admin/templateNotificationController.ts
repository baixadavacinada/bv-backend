import { Request, Response } from 'express';
import { Logger } from '../../../middlewares/logging';
import { SendTemplateNotificationUseCase } from '../../../application/use-cases/SendTemplateNotificationUseCase';
import { MongoNotificationJobRepository } from '../../../infrastructure/database/implementations/MongoNotificationJobRepository';
import { MongoNotificationAuditRepository } from '../../../infrastructure/database/implementations/MongoNotificationAuditRepository';
import { MongoNotificationTemplateRepository } from '../../../infrastructure/database/implementations/MongoNotificationTemplateRepository';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';
import { NotificationGateway } from '../../../services/notificationGateway';

const logger = Logger.getInstance();
const jobRepository = new MongoNotificationJobRepository();
const auditRepository = new MongoNotificationAuditRepository();
const templateRepository = new MongoNotificationTemplateRepository();
const userRepository = new MongoUserRepository();
const notificationGateway = new NotificationGateway();

const sendTemplateUseCase = new SendTemplateNotificationUseCase(
  jobRepository,
  auditRepository,
  templateRepository,
  userRepository,
  notificationGateway,
  logger
);

export async function sendTemplateNotification(req: Request, res: Response): Promise<void> {
  try {
    const { templateId, recipients, context, scheduledFor } = req.body;

    if (!templateId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'templateId is required' }
      });
      return;
    }

    if (!recipients || !recipients.mode) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'recipients.mode is required' }
      });
      return;
    }

    const result = await sendTemplateUseCase.execute({
      templateId,
      recipients,
      context: context || {},
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      performedBy: req.user?.id || 'system',
      performedByName: req.user?.email || 'Admin'
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'SEND_FAILED', message: result.message }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: result.jobId,
        message: result.message,
        preview: result.preview
      }
    });
  } catch (error) {
    logger.error('Error sending template notification', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function listJobs(req: Request, res: Response): Promise<void> {
  try {
    const { status, type, templateId, startDate, endDate } = req.query;

    const jobs = await jobRepository.findAll({
      status: status as any,
      type: type as any,
      templateId: templateId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    logger.error('Error listing jobs', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function getJob(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const job = await jobRepository.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found' }
      });
      return;
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    logger.error('Error getting job', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function cancelJob(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const job = await jobRepository.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found' }
      });
      return;
    }

    if (job.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only pending jobs can be cancelled' }
      });
      return;
    }

    const cancelled = await jobRepository.cancel(id);

    await auditRepository.create({
      action: 'job_cancelled',
      entityType: 'job',
      entityId: id,
      templateId: job.templateId,
      templateName: job.templateName,
      jobId: id,
      channel: 'whatsapp',
      success: true,
      performedBy: req.user?.id || 'system',
      performedByName: req.user?.email || 'Admin'
    });

    res.status(200).json({ success: true, data: cancelled });
  } catch (error) {
    logger.error('Error cancelling job', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function getJobStats(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, templateId } = req.query;

    const stats = await jobRepository.getStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      templateId: templateId as string
    });

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting job stats', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const {
      action, entityType, entityId, templateId, jobId, recipientId,
      channel, success, performedBy, startDate, endDate, limit, offset
    } = req.query;

    const result = await auditRepository.findAll(
      {
        action: action as any,
        entityType: entityType as any,
        entityId: entityId as string,
        templateId: templateId as string,
        jobId: jobId as string,
        recipientId: recipientId as string,
        channel: channel as any,
        success: success === 'true' ? true : success === 'false' ? false : undefined,
        performedBy: performedBy as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      },
      {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: { total: result.total, hasMore: result.hasMore }
    });
  } catch (error) {
    logger.error('Error getting audit logs', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function getAuditStats(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, templateId, performedBy } = req.query;

    const stats = await auditRepository.getStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      templateId: templateId as string,
      performedBy: performedBy as string
    });

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting audit stats', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function previewRecipients(req: Request, res: Response): Promise<void> {
  try {
    const { mode, userIds, filter } = req.query;

    if (!mode) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'mode is required' }
      });
      return;
    }

    let users: any[] = [];

    if (mode === 'single' || mode === 'broadcast') {
      const ids = typeof userIds === 'string' ? userIds.split(',') : Array.isArray(userIds) ? userIds : [];
      
      if (!ids || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'userIds required for single/broadcast' }
        });
        return;
      }

      for (const userId of ids) {
        if (typeof userId === 'string') {
          const user = await userRepository.findById(userId);
          if (user) users.push(user);
        }
      }
    } else if (mode === 'filter') {
      const allUsers = await userRepository.findAll();
      const filterObj = typeof filter === 'string' ? JSON.parse(filter) : filter;
      
      users = allUsers.filter(user => {
        if (filterObj?.role && user.role !== filterObj.role) return false;
        if (filterObj?.acceptWhatsAppNotifications !== undefined && 
            user.acceptWhatsAppNotifications !== filterObj.acceptWhatsAppNotifications) return false;
        if (filterObj?.hasPhone && !user.phone) return false;
        return true;
      });
    }

    const eligibleUsers = users
      .filter(user => user.acceptWhatsAppNotifications && user.phone)
      .map(user => ({
        userId: user.uid || user._id?.toString(),
        userName: user.name || user.displayName || user.email || 'Unknown',
        phone: user.phone.replace(/\d(?=\d{4})/g, '*'),
        email: user.email
      }));

    res.status(200).json({
      success: true,
      data: { total: eligibleUsers.length, recipients: eligibleUsers.slice(0, 100) }
    });
  } catch (error) {
    logger.error('Error previewing recipients', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function sendTemplateTest(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const { recipientEmail, context } = req.body;

    if (!templateId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'templateId is required' }
      });
      return;
    }

    if (!recipientEmail) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'recipientEmail is required' }
      });
      return;
    }

    // Get template
    const template = await templateRepository.findByTemplateId(templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template "${templateId}" not found` }
      });
      return;
    }

    // Send test using the SendTemplateNotificationUseCase
    const result = await sendTemplateUseCase.execute({
      templateId,
      recipients: {
        mode: 'single',
        userIds: [recipientEmail]
      },
      context: context || {},
      performedBy: req.user?.id || 'system',
      performedByName: `${req.user?.email || 'Admin'} (test)`
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'TEST_FAILED', message: result.message }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: result.jobId,
        message: `Test notification sent to ${recipientEmail}`,
        preview: result.preview
      }
    });
  } catch (error) {
    logger.error('Error sending test notification', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function getTemplateAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const { startDate, endDate } = req.query;

    if (!templateId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'templateId is required' }
      });
      return;
    }

    // Get template
    const template = await templateRepository.findByTemplateId(templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template "${templateId}" not found` }
      });
      return;
    }

    // Get audit stats for this template
    const stats = await auditRepository.getStats({
      templateId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    // Get recent jobs for this template
    const jobs = await jobRepository.findAll({
      templateId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    // Calculate analytics
    const totalSends = template.usageCount || 0;
    const successRate = template.successRate || 100;
    const lastUsed = template.lastUsedAt || null;

    // Group jobs by status
    const jobsByStatus = {
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };

    res.status(200).json({
      success: true,
      data: {
        templateId,
        templateName: template.name,
        analytics: {
          totalSends,
          successRate,
          lastUsedAt: lastUsed,
          jobsByStatus,
          stats
        },
        recentJobs: jobs.slice(0, 10).map(job => ({
          id: job.id,
          status: job.status,
          createdAt: job.createdAt,
          recipientCount: job.recipients?.length || 0,
          successCount: job.successCount || 0,
          failureCount: job.failureCount || 0
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting template analytics', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const { limit = '50', offset = '0', templateId, status, startDate, endDate } = req.query;

    const jobs = await jobRepository.findAll({
      templateId: templateId as string,
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const paginatedJobs = jobs.slice(offsetNum, offsetNum + limitNum);

    const history = paginatedJobs.map(job => ({
      id: job.id,
      templateId: job.templateId,
      templateName: job.templateName,
      recipientMode: job.recipientMode || 'broadcast',
      totalRecipients: job.recipients?.length || 0,
      successfulSends: job.successCount || 0,
      failedSends: job.failureCount || 0,
      channels: job.channels || ['whatsapp'],
      sentAt: job.createdAt,
      sentBy: job.createdByName || 'System',
      status: job.status,
      context: job.context
    }));

    res.status(200).json({
      success: true,
      data: {
        history,
        total: jobs.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < jobs.length
      }
    });
  } catch (error) {
    logger.error('Error getting notification history', error as Error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
}

export default {
  sendTemplateNotification,
  listJobs,
  getJob,
  cancelJob,
  getJobStats,
  getAuditLogs,
  getAuditStats,
  previewRecipients,
  sendTemplateTest,
  getTemplateAnalytics,
  getHistory
};
