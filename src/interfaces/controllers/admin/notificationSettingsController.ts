import { Request, Response } from 'express';
import { MongoUserRepository } from '../../../infrastructure/database/implementations/MongoUserRepository';
import { Logger } from '../../../middlewares/logging';

export interface NotificationSetting {
  enabled: boolean;
  templateId?: string;
  frequency: 'instant' | 'daily' | 'weekly' | 'never';
}

export interface UserNotificationSettings {
  userId: string;
  notifications: Record<string, boolean>;
  templateSettings: Record<string, NotificationSetting>;
  updatedAt: Date;
}

export class NotificationSettingsController {
  private userRepository = new MongoUserRepository();
  private logger = Logger.getInstance();

  /**
   * Get notification settings for authenticated user
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' }
        });
        return;
      }

      // Fetch user and their settings
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
        return;
      }

      // Return settings or empty defaults if not set
      const settings = {
        notifications: (user as any).notificationSettings?.notifications || {},
        templateSettings: (user as any).notificationSettings?.templateSettings || {},
      };

      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      this.logger.error('Failed to get notification settings', error as Error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch settings' }
      });
    }
  }

  /**
   * Save notification settings for authenticated user
   */
  async saveSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      const { notifications = {}, templateSettings = {} } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' }
        });
        return;
      }

      // Validate payload
      if (typeof notifications !== 'object' || typeof templateSettings !== 'object') {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid settings format' }
        });
        return;
      }

      // Fetch user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
        return;
      }

      // Update user with new settings
      const updatedUser = await this.userRepository.update(userId, {
        notificationSettings: {
          notifications,
          templateSettings,
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Settings saved successfully',
        data: {
          notifications,
          templateSettings
        }
      });
    } catch (error) {
      this.logger.error('Failed to save notification settings', error as Error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to save settings' }
      });
    }
  }
}

export const notificationSettingsController = new NotificationSettingsController();
