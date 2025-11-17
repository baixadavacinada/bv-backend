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

      // Find notification by external message ID and update status
      const updated = await this.notificationRepository.updateDeliveryStatus(
        MessageSid,
        internalStatus,
        MessageSid
      );

      if (!updated) {
        this.logger.warn('Notification not found for webhook update', {
          messageSid: MessageSid
        });
      }

      res.status(200).json({
        message: 'Status update processed successfully',
        messageSid: MessageSid,
        status: internalStatus
      });
    } catch (error) {
      this.logger.error('Error processing WhatsApp webhook', error as Error, {
        body: req.body
      });
      res.status(500).json({
        message: 'Error processing webhook'
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
