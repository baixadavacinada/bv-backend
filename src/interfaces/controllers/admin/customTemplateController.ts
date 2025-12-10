/**
 * Template Management Controller
 * Endpoints for admin/agent to create, edit, and delete custom templates
 */

import { Router, Request, Response } from 'express'
import { Logger } from '../../../middlewares/logging'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const logger = Logger.getInstance()

// Store templates in memory for now (will be replaced with database)
const customTemplates: Record<string, any> = {}

interface NotificationTemplate {
  id: string
  name: string
  description: string
  subject: string
  body: string
  category: 'appointment' | 'vaccine' | 'reminder' | 'system' | 'general'
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

// Middleware: Verify admin or agent role
const verifyAdminOrAgent = (req: Request, res: Response, next: Function) => {
  const userRole = (req as any).user?.role
  if (userRole !== 'admin' && userRole !== 'agent') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Admin or Agent role required.',
      },
    })
  }
  next()
}

/**
 * GET /api/admin/custom-templates
 * List all custom templates
 */
router.get('/', verifyAdminOrAgent, (req: Request, res: Response) => {
  try {
    const templates = Object.values(customTemplates)

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length,
      },
    })
  } catch (error) {
    logger.error('Error listing custom templates', error as Error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list templates',
      },
    })
  }
})

/**
 * GET /api/admin/custom-templates/:templateId
 * Get specific template details
 */
router.get('/:templateId', verifyAdminOrAgent, (req: Request, res: Response) => {
  try {
    const { templateId } = req.params
    const template = customTemplates[templateId]

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Template not found',
        },
      })
    }

    res.json({
      success: true,
      data: template,
    })
  } catch (error) {
    logger.error('Error fetching custom template', error as Error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch template',
      },
    })
  }
})

/**
 * POST /api/admin/custom-templates
 * Create a new custom template
 */
router.post('/', verifyAdminOrAgent, (req: Request, res: Response) => {
  try {
    const { name, description, subject, body, category } = req.body
    const userId = (req as any).user?.id || 'unknown'

    // Validate required fields
    if (!name || !description || !subject || !body || !category) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: name, description, subject, body, category',
        },
      })
    }

    // Validate category
    const validCategories = ['appointment', 'vaccine', 'reminder', 'system', 'general']
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        },
      })
    }

    // Validate variables format (must be {{variableName}})
    const variableRegex = /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g
    const subjectVars = subject.match(variableRegex) || []
    const bodyVars = body.match(variableRegex) || []

    if (!variableRegex.test(subject) && !variableRegex.test(body)) {
      logger.warn('Template created without variables')
    }

    const templateId = uuidv4()
    const template: NotificationTemplate = {
      id: templateId,
      name,
      description,
      subject,
      body,
      category,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    customTemplates[templateId] = template

    res.status(201).json({
      success: true,
      data: {
        template,
        message: 'Template created successfully',
      },
    })

    logger.info(`Template created: ${templateId} by ${userId}`)
  } catch (error) {
    logger.error('Error creating custom template', error as Error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create template',
      },
    })
  }
})

/**
 * PUT /api/admin/custom-templates/:templateId
 * Update an existing template
 */
router.put('/:templateId', verifyAdminOrAgent, (req: Request, res: Response) => {
  try {
    const { templateId } = req.params
    const { name, description, subject, body, category } = req.body
    const userId = (req as any).user?.id || 'unknown'

    const template = customTemplates[templateId]
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Template not found',
        },
      })
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['appointment', 'vaccine', 'reminder', 'system', 'general']
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          },
        })
      }
    }

    // Update allowed fields (but not createdBy or createdAt)
    const updatedTemplate: NotificationTemplate = {
      ...template,
      ...(name && { name }),
      ...(description && { description }),
      ...(subject && { subject }),
      ...(body && { body }),
      ...(category && { category }),
      updatedAt: new Date(),
    }

    customTemplates[templateId] = updatedTemplate

    res.json({
      success: true,
      data: {
        template: updatedTemplate,
        message: 'Template updated successfully',
      },
    })

    logger.info(`Template updated: ${templateId} by ${userId}`)
  } catch (error) {
    logger.error('Error updating custom template', error as Error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update template',
      },
    })
  }
})

/**
 * DELETE /api/admin/custom-templates/:templateId
 * Delete a template
 */
router.delete('/:templateId', verifyAdminOrAgent, (req: Request, res: Response) => {
  try {
    const { templateId } = req.params
    const userId = (req as any).user?.id || 'unknown'

    if (!customTemplates[templateId]) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Template not found',
        },
      })
    }

    delete customTemplates[templateId]

    res.json({
      success: true,
      data: {
        message: 'Template deleted successfully',
      },
    })

    logger.info(`Template deleted: ${templateId} by ${userId}`)
  } catch (error) {
    logger.error('Error deleting custom template', error as Error)
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete template',
      },
    })
  }
})

export default router
