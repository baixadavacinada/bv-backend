import { NotificationJobRepository } from '../../domain/repositories/NotificationJobRepository';
import { NotificationAuditRepository } from '../../domain/repositories/NotificationAuditRepository';
import { NotificationTemplateRepository } from '../../domain/repositories/NotificationTemplateRepository';
import { MongoUserRepository } from '../../infrastructure/database/implementations/MongoUserRepository';
import { NotificationGateway } from '../../services/notificationGateway';
import { Logger } from '../../middlewares/logging';
import { NotificationRecipient, CreateNotificationJobDTO } from '../../domain/entities/NotificationJob';
import { NotificationTemplate } from '../../domain/entities/NotificationTemplate';

interface SendTemplateNotificationRequest {
  templateId: string;
  recipients: {
    mode: 'single' | 'broadcast' | 'filter';
    userIds?: string[];
    filter?: {
      role?: 'public' | 'agent' | 'admin';
      acceptWhatsAppNotifications?: boolean;
      hasPhone?: boolean;
    };
  };
  context: Record<string, any>;
  scheduledFor?: Date;
  performedBy: string;
  performedByName: string;
}

interface SendTemplateNotificationResponse {
  success: boolean;
  jobId?: string;
  message: string;
  preview?: {
    subject: string;
    body: string;
    recipientsCount: number;
    recipients: Array<{
      userId: string;
      userName: string;
      phone: string;
    }>;
  };
}

export class SendTemplateNotificationUseCase {
  constructor(
    private readonly jobRepository: NotificationJobRepository,
    private readonly auditRepository: NotificationAuditRepository,
    private readonly templateRepository: NotificationTemplateRepository,
    private readonly userRepository: MongoUserRepository,
    private readonly notificationGateway: NotificationGateway,
    private readonly logger: Logger
  ) {}

  async execute(request: SendTemplateNotificationRequest): Promise<SendTemplateNotificationResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate and get template
      const template = await this.templateRepository.findByTemplateId(request.templateId);
      
      if (!template) {
        return {
          success: false,
          message: `Template "${request.templateId}" not found`
        };
      }

      if (template.status !== 'ativo') {
        return {
          success: false,
          message: `Template "${template.name}" is not active`
        };
      }

      // 2. Get recipients
      const recipients = await this.getRecipients(request.recipients);
      
      if (recipients.length === 0) {
        return {
          success: false,
          message: 'No eligible recipients found'
        };
      }

      // 3. Render template
      const rendered = this.renderTemplate(template, request.context);

      // 4. Create job
      const jobData: CreateNotificationJobDTO = {
        templateId: template.id,
        recipients: request.recipients,
        context: request.context,
        scheduledFor: request.scheduledFor,
        createdBy: request.performedBy,
        createdByName: request.performedByName
      };

      const job = await this.jobRepository.create(jobData);

      // Update template metadata (usageCount and lastUsedAt)
      await this.templateRepository.update(template.id, {
        usageCount: (template.usageCount || 0) + 1,
        lastUsedAt: new Date()
      });

      // Update job with recipients and rendered content
      await this.jobRepository.updateProgress(job.id, {
        successCount: 0,
        failureCount: 0,
        startedAt: request.scheduledFor ? undefined : new Date()
      });

      // Update recipients in job
      for (const recipient of recipients) {
        await this.jobRepository.updateRecipientStatus(job.id, recipient.userId, {
          status: 'pending'
        });
      }

      // 5. Audit job creation
      await this.auditRepository.create({
        action: 'job_created',
        entityType: 'job',
        entityId: job.id,
        templateId: template.id,
        templateName: template.name,
        jobId: job.id,
        channel: 'whatsapp',
        success: true,
        performedBy: request.performedBy,
        performedByName: request.performedByName,
        requestPayload: {
          templateId: request.templateId,
          recipientsMode: request.recipients.mode,
          recipientsCount: recipients.length,
          scheduledFor: request.scheduledFor
        },
        durationMs: Date.now() - startTime
      });

      // 6. If immediate, send now
      if (!request.scheduledFor) {
        await this.processJob(job.id, template, recipients, rendered, request.context);
      }

      return {
        success: true,
        jobId: job.id,
        message: request.scheduledFor 
          ? `Notification scheduled for ${recipients.length} recipients`
          : `Sending notification to ${recipients.length} recipients`,
        preview: {
          subject: rendered.subject,
          body: rendered.body,
          recipientsCount: recipients.length,
          recipients: recipients.slice(0, 5).map(r => ({
            userId: r.userId,
            userName: r.userName,
            phone: this.maskPhone(r.phone)
          }))
        }
      };

    } catch (error) {
      this.logger.error('Failed to send template notification', error as Error, {
        templateId: request.templateId,
        performedBy: request.performedBy
      });

      // Audit failure
      await this.auditRepository.create({
        action: 'job_failed',
        entityType: 'job',
        entityId: 'unknown',
        templateId: request.templateId,
        channel: 'whatsapp',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performedBy: request.performedBy,
        performedByName: request.performedByName,
        durationMs: Date.now() - startTime
      });

      return {
        success: false,
        message: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getRecipients(criteria: SendTemplateNotificationRequest['recipients']): Promise<NotificationRecipient[]> {
    let users: any[] = [];

    if (criteria.mode === 'single' || criteria.mode === 'broadcast') {
      if (!criteria.userIds || criteria.userIds.length === 0) {
        return [];
      }

      for (const userId of criteria.userIds) {
        const user = await this.userRepository.findById(userId);
        if (user) {
          users.push(user);
        }
      }
    } else if (criteria.mode === 'filter') {
      const allUsers = await this.userRepository.findAll();
      
      users = allUsers.filter(user => {
        if (criteria.filter?.role && user.role !== criteria.filter.role) {
          return false;
        }
        if (criteria.filter?.acceptWhatsAppNotifications !== undefined && 
            user.acceptWhatsAppNotifications !== criteria.filter.acceptWhatsAppNotifications) {
          return false;
        }
        if (criteria.filter?.hasPhone && !user.phone) {
          return false;
        }
        return true;
      });
    }

    // Filter only users with WhatsApp enabled and phone number
    return users
      .filter(user => user.acceptWhatsAppNotifications && user.phone)
      .map(user => ({
        userId: user.uid || user._id?.toString() || '',
        userName: user.name || user.displayName || user.email || 'Unknown',
        phone: user.phone,
        email: user.email,
        status: 'pending' as const
      }));
  }

  private renderTemplate(template: NotificationTemplate, context: Record<string, any>): { subject: string; body: string } {
    const interpolate = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? String(context[key]) : match;
      });
    };

    return {
      subject: interpolate(template.subject),
      body: interpolate(template.body)
    };
  }

  private async processJob(
    jobId: string,
    template: NotificationTemplate,
    recipients: NotificationRecipient[],
    rendered: { subject: string; body: string },
    context: Record<string, any>
  ): Promise<void> {
    await this.jobRepository.updateStatus(jobId, 'processing');

    let successCount = 0;
    let failureCount = 0;

    // Audit job started
    await this.auditRepository.create({
      action: 'job_started',
      entityType: 'job',
      entityId: jobId,
      templateId: template.id,
      templateName: template.name,
      jobId,
      channel: 'whatsapp',
      success: true,
      performedBy: 'system',
      performedByName: 'System'
    });

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        const result = await this.notificationGateway.send({
          channel: 'whatsapp',
          to: recipient.phone,
          title: rendered.subject,
          message: rendered.body
        });

        if (result.success) {
          successCount++;
          await this.jobRepository.updateRecipientStatus(jobId, recipient.userId, {
            status: 'sent',
            sentAt: new Date(),
            messageId: result.messageId
          });

          // Audit individual send
          await this.auditRepository.create({
            action: 'notification_sent',
            entityType: 'notification',
            entityId: result.messageId || 'unknown',
            templateId: template.id,
            templateName: template.name,
            jobId,
            recipientId: recipient.userId,
            recipientName: recipient.userName,
            recipientPhone: recipient.phone,
            channel: 'whatsapp',
            subject: rendered.subject,
            body: rendered.body,
            context,
            success: true,
            messageId: result.messageId,
            performedBy: 'system',
            performedByName: 'System'
          });
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error) {
        failureCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        await this.jobRepository.updateRecipientStatus(jobId, recipient.userId, {
          status: 'failed',
          error: errorMsg
        });

        await this.jobRepository.addError(jobId, {
          recipientId: recipient.userId,
          error: errorMsg,
          timestamp: new Date()
        });

        // Audit failure
        await this.auditRepository.create({
          action: 'notification_failed',
          entityType: 'notification',
          entityId: 'failed',
          templateId: template.id,
          templateName: template.name,
          jobId,
          recipientId: recipient.userId,
          recipientName: recipient.userName,
          recipientPhone: recipient.phone,
          channel: 'whatsapp',
          subject: rendered.subject,
          body: rendered.body,
          context,
          success: false,
          error: errorMsg,
          performedBy: 'system',
          performedByName: 'System'
        });
      }
    }

    // Update job completion
    const finalStatus = failureCount === recipients.length ? 'failed' : 'completed';
    
    await this.jobRepository.updateProgress(jobId, {
      successCount,
      failureCount,
      completedAt: new Date(),
      status: finalStatus
    });

    // Audit job completion
    await this.auditRepository.create({
      action: finalStatus === 'completed' ? 'job_completed' : 'job_failed',
      entityType: 'job',
      entityId: jobId,
      templateId: template.id,
      templateName: template.name,
      jobId,
      channel: 'whatsapp',
      success: finalStatus === 'completed',
      performedBy: 'system',
      performedByName: 'System',
      responsePayload: {
        total: recipients.length,
        successCount,
        failureCount
      }
    });
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return phone;
    return phone.replace(/\d(?=\d{4})/g, '*');
  }
}
