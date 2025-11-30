import { Request, Response } from 'express';
import { MongoNotificationRepository } from '../../../infrastructure/database/implementations/MongoNotificationRepository';
import { Logger } from '../../../middlewares/logging';

export class WebhookController {
  private notificationRepository = new MongoNotificationRepository();
  private logger = Logger.getInstance();

  /**
   * Handle WhatsApp webhook for message status updates
   * Receives status updates from Z-API provider
   */
  async handleWhatsAppStatusUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { MessageSid, MessageStatus } = req.body;

      if (!MessageSid || !MessageStatus) {
        res.status(400).json({
          success: false,
          message: 'MessageSid and MessageStatus are required'
        });
        return;
      }

      this.logger.info('Received WhatsApp status update', {
        messageSid: MessageSid,
        status: MessageStatus
      });

      // Map Z-API status to our status
      let internalStatus: 'sent' | 'delivered' | 'failed' | 'read' = 'sent';
      
      switch (MessageStatus?.toLowerCase()) {
        case 'sent':
          internalStatus = 'sent';
          break;
        case 'delivered':
          internalStatus = 'delivered';
          break;
        case 'read':
          internalStatus = 'read';
          break;
        case 'failed':
        case 'undelivered':
          internalStatus = 'failed';
          break;
        default:
          internalStatus = 'sent';
      }

      // Try to find and update notification by external message ID
      try {
        const updated = await this.notificationRepository.updateDeliveryStatus(
          MessageSid,
          internalStatus,
          MessageSid
        );

        if (updated) {
          this.logger.info('Notification status updated', {
            messageSid: MessageSid,
            newStatus: internalStatus
          });
        } else {
          this.logger.warn('Notification not found for webhook update', {
            messageSid: MessageSid
          });
        }
      } catch (dbError) {
        this.logger.warn('Could not update notification in database', {
          messageSid: MessageSid,
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        messageSid: MessageSid,
        status: internalStatus
      });
    } catch (error) {
      this.logger.error('Error processing WhatsApp webhook', error as Error, {
        body: req.body
      });
      res.status(200).json({
        success: true,
        message: 'Webhook processed (with errors)',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Health check endpoint for webhook
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      message: 'Webhook service is running',
      timestamp: new Date().toISOString()
    });
  }
}
