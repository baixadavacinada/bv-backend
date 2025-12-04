/**
 * Template Notification Controller
 * Endpoints for managing and sending template-based notifications
 */

import { Router, Request, Response } from 'express';
import { TemplateNotificationService } from '../../../services/templateNotificationService';
import { NotificationTemplates } from '../../../services/notificationTemplates';
import { Logger } from '../../../middlewares/logging';

const router = Router();
const logger = Logger.getInstance();

// Middleware: Verify admin role
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const userRole = (req as any).user?.role;
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Admin role required.'
      }
    });
  }
  next();
};

/**
 * GET /api/admin/templates
 * List all available templates
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const templates = NotificationTemplates.listAll();

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length
      }
    });
  } catch (error) {
    logger.error('Error listing templates', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list templates'
      }
    });
  }
});

/**
 * GET /api/admin/templates/:templateId
 * Get specific template details
 */
router.get('/:templateId', (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = NotificationTemplates.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Template not found'
        }
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error fetching template', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch template'
      }
    });
  }
});

/**
 * GET /api/admin/templates/category/:category
 * Get templates by category
 */
router.get('/category/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const validCategories = ['appointment', 'vaccine', 'reminder', 'system', 'general'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        }
      });
    }

    const templates = NotificationTemplates.getTemplatesByCategory(category as any);

    res.json({
      success: true,
      data: {
        templates,
        category,
        count: templates.length
      }
    });
  } catch (error) {
    logger.error('Error fetching templates by category', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch templates'
      }
    });
  }
});

/**
 * POST /api/admin/templates/:templateId/preview
 * Preview a template with context
 */
router.post('/:templateId/preview', (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { context } = req.body;

    const rendered = TemplateNotificationService.previewTemplate(templateId, context);

    if (!rendered) {
      return res.status(404).json({
        success: false,
        error: 'Template not found or failed to render'
      });
    }

    res.json({
      success: true,
      data: {
        templateId,
        rendered
      }
    });
  } catch (error) {
    logger.error('Error previewing template', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to preview template'
      }
    });
  }
});

/**
 * POST /api/admin/templates/:templateId/send
 * Send notification using template to a single user
 */
router.post('/:templateId/send', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { userId, context, channels = ['email', 'whatsapp'] } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'userId is required'
        }
      });
    }

    // Validate template exists
    const template = NotificationTemplates.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Template not found'
        }
      });
    }

    // Send notification
    const result = await TemplateNotificationService.sendTemplateNotification({
      userId,
      templateId,
      context,
      channels
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: result.message || 'Failed to send notification'
        }
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error sending template notification', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send notification'
      }
    });
  }
});

/**
 * POST /api/admin/templates/:templateId/broadcast
 * Send notification using template to multiple users
 */
router.post('/:templateId/broadcast', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { userIds, context, channels = ['email', 'whatsapp'] } = req.body;

    // Validate required fields
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'userIds array is required and must not be empty'
        }
      });
    }

    // Validate template exists
    const template = NotificationTemplates.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Template not found'
        }
      });
    }

    // Send broadcast
    const result = await TemplateNotificationService.broadcastTemplateNotification(
      userIds,
      templateId,
      context,
      channels
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error broadcasting template notification', error as Error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to broadcast notification'
      }
    });
  }
});

export default router;
