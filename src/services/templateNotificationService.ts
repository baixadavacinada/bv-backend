/**
 * Template Notification Service
 * Integrates notification templates with the notification gateway
 */

import { NotificationGateway } from './notificationGateway';
import { notificationTemplatesService } from './notificationTemplatesDbService';
import { TemplateContext } from '../domain/entities/NotificationTemplate';
import { Logger } from '../middlewares/logging';

export interface TemplateNotificationPayload {
  userId: string;
  templateId: string;
  context?: TemplateContext;
  channels?: ('email' | 'whatsapp' | 'push')[];
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

export interface TemplateNotificationResult {
  success: boolean;
  message?: string;
  messageId?: string;
  channels?: {
    email?: { success: boolean; messageId?: string };
    whatsapp?: { success: boolean; messageId?: string };
    push?: { success: boolean; messageId?: string };
  };
}

/**
 * Service for sending notifications using predefined templates
 */
export class TemplateNotificationService {
  private static logger = Logger.getInstance();
  private static notificationGateway = new NotificationGateway();

  /**
   * Send notification using a template
   */
  static async sendTemplateNotification(payload: TemplateNotificationPayload): Promise<TemplateNotificationResult> {
    try {
      const { userId, templateId, context = {}, channels = ['email', 'whatsapp'], priority = 'normal' } = payload;

      // Validate template exists
      const template = await notificationTemplatesService.getTemplate(templateId);
      if (!template) {
        this.logger.warn(`Template not found: ${templateId}`);
        return {
          success: false,
          message: `Template "${templateId}" not found`
        };
      }

      // Render template with context
      const rendered = await notificationTemplatesService.render(templateId, context);
      if (!rendered) {
        return {
          success: false,
          message: `Failed to render template "${templateId}"`
        };
      }

      // Build payloads for each channel
      const results = await Promise.all(
        channels.map(channel =>
          this.notificationGateway.send({
            channel,
            to: userId,
            title: rendered.subject,
            message: rendered.body,
            data: {
              templateId,
              templateName: template.name,
              timestamp: new Date().toISOString()
            }
          })
        )
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: failed === 0,
        message: failed === 0 ? 'Notification sent successfully' : `Sent to ${successful}/${channels.length} channels`,
        messageId: results.find(r => r.success)?.messageId
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending template notification: ${errorMsg}`, error as Error);

      return {
        success: false,
        message: `Error: ${errorMsg}`
      };
    }
  }

  /**
   * Send template notification to multiple users
   */
  static async broadcastTemplateNotification(
    userIds: string[],
    templateId: string,
    context?: TemplateContext,
    channels?: ('email' | 'whatsapp' | 'push')[]
  ): Promise<{
    success: boolean;
    total: number;
    successful: number;
    failed: number;
    results: TemplateNotificationResult[];
  }> {
    const results = await Promise.all(
      userIds.map((userId) =>
        this.sendTemplateNotification({
          userId,
          templateId,
          context,
          channels
        })
      )
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      total: userIds.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Get available templates for a specific category
   */
  static async getTemplatesByCategory(category: 'appointment' | 'vaccine' | 'reminder' | 'system' | 'general') {
    return await notificationTemplatesService.getTemplatesByCategory(category);
  }

  /**
   * List all available templates
   */
  static async listAllTemplates() {
    return await notificationTemplatesService.listAll();
  }

  /**
   * Preview a template rendering
   */
  static async previewTemplate(templateId: string, context?: TemplateContext) {
    return await notificationTemplatesService.render(templateId, context || {});
  }
}
