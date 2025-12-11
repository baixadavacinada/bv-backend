/**
 * Notification Templates Controller
 * Handles CRUD operations for notification templates
 */

import { Request, Response } from 'express';
import { notificationTemplatesService } from '../../../services/notificationTemplatesDbService';
import { Logger } from '../../../middlewares/logging';

const logger = Logger.getInstance();

/**
 * List all templates
 * GET /api/admin/templates
 */
export const listTemplates = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    
    const filters: any = {};
    if (category) filters.category = category as string;
    if (status) filters.status = status as string;

    const templates = await notificationTemplatesService.listAll(filters);

    return res.status(200).json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Failed to list templates', error as Error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list templates'
      }
    });
  }
};

/**
 * Get template by ID
 * GET /api/admin/templates/:templateId
 */
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    
    const template = await notificationTemplatesService.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Failed to get template', error as Error, { templateId: req.params.templateId });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get template'
      }
    });
  }
};

/**
 * Create new template
 * POST /api/admin/templates
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const templateData = req.body;

    // Validate required fields
    if (!templateData.id || !templateData.name || !templateData.subject || !templateData.body || !templateData.category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required fields: id, name, subject, body, category'
        }
      });
    }

    const created = await notificationTemplatesService.createTemplate(templateData);
    
    if (!created) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Failed to create template'
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    logger.error('Failed to create template', error as Error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create template'
      }
    });
  }
};

/**
 * Update template
 * PUT /api/admin/templates/:id
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await notificationTemplatesService.updateTemplate(id, updateData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error('Failed to update template', error as Error, { id: req.params.id });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update template'
      }
    });
  }
};

/**
 * Delete template
 * DELETE /api/admin/templates/:id
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await notificationTemplatesService.deleteTemplate(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete template', error as Error, { id: req.params.id });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete template'
      }
    });
  }
};

/**
 * Get templates by category
 * GET /api/admin/templates/category/:category
 */
export const getTemplatesByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const templates = await notificationTemplatesService.getTemplatesByCategory(
      category as any
    );

    return res.status(200).json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Failed to get templates by category', error as Error, { category: req.params.category });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get templates by category'
      }
    });
  }
};

/**
 * Render template preview
 * POST /api/admin/templates/:templateId/preview
 */
export const previewTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const context = req.body;

    const rendered = await notificationTemplatesService.render(templateId, context);
    
    if (!rendered) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: rendered
    });
  } catch (error) {
    logger.error('Failed to preview template', error as Error, { templateId: req.params.templateId });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to preview template'
      }
    });
  }
};
