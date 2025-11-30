import { Request, Response } from 'express';
import { Logger } from '../../../middlewares/logging';
import { NotificationGateway } from '../../../services/notificationGateway';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';

/**
 * Controller for sending WhatsApp notifications to users
 * Handles sending individual and bulk WhatsApp messages
 */
export class WhatsAppNotificationController {
  private logger = Logger.getInstance();
  private notificationGateway = new NotificationGateway();
  private userRepository = new MongoUserRepository();

  /**
   * Send WhatsApp notification to a single user
   * POST /api/admin/notifications/whatsapp/send
   */
  async sendToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, message, title, type = 'general', data } = req.body;

      if (!userId || !message) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'userId and message are required'
          }
        });
        return;
      }

      // Get user by Firebase UID
      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User ${userId} not found`
          }
        });
        return;
      }

      // Check if user has WhatsApp enabled
      if (!user.acceptWhatsAppNotifications) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WHATSAPP_NOT_ENABLED',
            message: `User ${userId} has not enabled WhatsApp notifications`
          }
        });
        return;
      }

      // Check if user has phone number
      if (!user.phone) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_PHONE_NUMBER',
            message: `User ${userId} does not have a phone number registered`
          }
        });
        return;
      }

      // Send WhatsApp message via notification gateway
      const result = await this.notificationGateway.send({
        channel: 'whatsapp',
        to: user.phone,
        title: title || type,
        message,
        data
      });

      if (!result.success) {
        this.logger.error('Failed to send WhatsApp notification', new Error(result.error || 'Unknown error'), {
          userId
        });

        res.status(500).json({
          success: false,
          error: {
            code: 'SEND_FAILED',
            message: 'Failed to send WhatsApp message',
            details: result.error
          }
        });
        return;
      }

      this.logger.info('WhatsApp notification sent successfully', {
        userId,
        messageId: result.messageId,
        to: user.phone
      });

      res.status(200).json({
        success: true,
        data: {
          messageId: result.messageId,
          userId,
          channel: 'whatsapp',
          sentAt: result.timestamp
        }
      });
    } catch (error) {
      this.logger.error('Error sending WhatsApp notification', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Send WhatsApp notifications to multiple users
   * POST /api/admin/notifications/whatsapp/broadcast
   */
  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, message, title, type = 'general', data, filter } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'message is required'
          }
        });
        return;
      }

      // Get target users
      let targetUsers: any[] = [];

      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        // Send to specific users
        for (const uid of userIds) {
          const user = await this.userRepository.findById(uid);
          if (user && user.acceptWhatsAppNotifications && user.phone) {
            targetUsers.push(user);
          }
        }
      } else if (filter) {
        // Get all users and apply filter
        const allUsers = await this.userRepository.findAll();
        targetUsers = allUsers.filter((user) => {
          // Filter by role if specified
          if (filter.role && user.role !== filter.role) return false;
          // Filter by active status
          if (filter.isActive !== undefined && user.isActive !== filter.isActive) return false;
          // Must have WhatsApp enabled and phone
          if (!user.acceptWhatsAppNotifications || !user.phone) return false;
          return true;
        });
      }

      if (targetUsers.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_RECIPIENTS',
            message: 'No eligible recipients found'
          }
        });
        return;
      }

      // Send messages in batch
      const results = await this.notificationGateway.sendBatch(
        targetUsers.map((user) => ({
          channel: 'whatsapp' as const,
          to: user.phone!,
          title: title || type,
          message,
          data
        }))
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      this.logger.info('WhatsApp broadcast completed', {
        total: results.length,
        successful,
        failed
      });

      res.status(200).json({
        success: true,
        data: {
          total: results.length,
          successful,
          failed,
          results: results.map((r, i) => ({
            userId: targetUsers[i]._id,
            messageId: r.messageId,
            success: r.success,
            error: r.error
          }))
        }
      });
    } catch (error) {
      this.logger.error('Error sending WhatsApp broadcast', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * Get WhatsApp delivery status
   * GET /api/admin/notifications/whatsapp/status/:messageId
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'messageId is required'
          }
        });
        return;
      }

      // This would typically query the database or WhatsApp service
      // For now, we return a placeholder response
      res.status(200).json({
        success: true,
        data: {
          messageId,
          status: 'unknown',
          message: 'Status tracking coming soon'
        }
      });
    } catch (error) {
      this.logger.error('Error getting WhatsApp status', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });
    }
  }
}
