import { Logger } from '../middlewares/logging';
import { WhatsAppMessage } from './zapiWhatsappService';
import { WhatsAppServiceFactory, IWhatsAppService } from './whatsappServiceFactory';

export type NotificationChannel = 'whatsapp' | 'push' | 'email' | 'in_app';

export interface NotificationGatewayPayload {
  channel: NotificationChannel;
  to: string; // userId for in_app, email for email, phone for whatsapp
  title: string;
  message: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>; // Additional data for the notification
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export class NotificationGateway {
  private logger = Logger.getInstance();
  private whatsappService: IWhatsAppService;

  constructor() {
    this.whatsappService = WhatsAppServiceFactory.getInstance();
  }


  async send(payload: NotificationGatewayPayload): Promise<NotificationResult> {
    try {
      switch (payload.channel) {
        case 'whatsapp':
          return await this.sendWhatsApp(payload);

        case 'email':
          return await this.sendEmail(payload);

        case 'push':
          return await this.sendPush(payload);

        case 'in_app':
          return await this.sendInApp(payload);

        default:
          return {
            channel: payload.channel,
            success: false,
            error: `Unknown notification channel: ${payload.channel}`,
            timestamp: new Date()
          };
      }
    } catch (error) {
      this.logger.error('Failed to send notification', error as Error, {
        channel: payload.channel,
        to: payload.to
      });

      return {
        channel: payload.channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send multiple notifications in parallel
   */
  async sendBatch(payloads: NotificationGatewayPayload[]): Promise<NotificationResult[]> {
    const results = await Promise.allSettled(
      payloads.map(payload => this.send(payload))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      return {
        channel: payloads[index].channel,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        timestamp: new Date()
      };
    });
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsApp(
    payload: NotificationGatewayPayload
  ): Promise<NotificationResult> {
    if (!this.whatsappService.isConfigured()) {
      this.logger.warn('WhatsApp service not configured');
      return {
        channel: 'whatsapp',
        success: false,
        error: 'WhatsApp service not configured',
        timestamp: new Date()
      };
    }

    const messageBody = `*${payload.title}*\n\n${payload.message}`;

    const whatsappMessage: WhatsAppMessage = {
      to: payload.to,
      body: messageBody,
      mediaUrl: payload.mediaUrl
    };

    const messageId = await this.whatsappService.sendMessage(whatsappMessage);

    return {
      channel: 'whatsapp',
      success: !!messageId,
      messageId: messageId || undefined,
      error: messageId ? undefined : 'Failed to send WhatsApp message',
      timestamp: new Date()
    };
  }

  /**
   * Send Email (placeholder for future implementation)
   */
  private async sendEmail(
    payload: NotificationGatewayPayload
  ): Promise<NotificationResult> {
    this.logger.info('Email notification queued (not yet implemented)', {
      to: payload.to
    });

    return {
      channel: 'email',
      success: true,
      messageId: `email_${Date.now()}`,
      timestamp: new Date()
    };
  }

  /**
   * Send Push Notification (placeholder for future implementation)
   */
  private async sendPush(
    payload: NotificationGatewayPayload
  ): Promise<NotificationResult> {
    this.logger.info('Push notification queued (not yet implemented)', {
      to: payload.to
    });

    return {
      channel: 'push',
      success: true,
      messageId: `push_${Date.now()}`,
      timestamp: new Date()
    };
  }

  /**
   * Send In-App Notification (stored in DB, shown in UI)
   */
  private async sendInApp(
    payload: NotificationGatewayPayload
  ): Promise<NotificationResult> {
    // This is handled by the repository, just mark as successful here
    return {
      channel: 'in_app',
      success: true,
      messageId: `in_app_${Date.now()}`,
      timestamp: new Date()
    };
  }

  /**
   * Get gateway status for all channels
   */
  getStatus() {
    return {
      whatsapp: this.whatsappService.getStatus(),
      timestamp: new Date()
    };
  }
}
