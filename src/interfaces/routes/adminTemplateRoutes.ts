/**
 * Notification Templates Routes (Admin)
 * CRUD operations for managing notification templates
 */

import { Router } from 'express';
import * as templateController from '../controllers/admin/templateController';
import { requireAdminOrAgent } from '../../middlewares/firebaseAuthAdvanced';

const router = Router();

// All template routes require admin authentication
router.use(requireAdminOrAgent);

/**
 * GET /api/admin/templates
 * List all templates (with optional filters)
 * Query params: ?category=vaccine&status=ativo
 */
router.get('/', templateController.listTemplates);

/**
 * GET /api/admin/templates/category/:category
 * Get templates by category
 */
router.get('/category/:category', templateController.getTemplatesByCategory);

/**
 * GET /api/admin/templates/:templateId
 * Get specific template by template ID
 */
router.get('/:templateId', templateController.getTemplate);

/**
 * POST /api/admin/templates
 * Create new template
 */
router.post('/', templateController.createTemplate);

/**
 * POST /api/admin/templates/:templateId/preview
 * Preview rendered template with context
 */
router.post('/:templateId/preview', templateController.previewTemplate);

/**
 * PUT /api/admin/templates/:id
 * Update template
 */
router.put('/:id', templateController.updateTemplate);

/**
 * DELETE /api/admin/templates/:id
 * Delete template
 */
router.delete('/:id', templateController.deleteTemplate);

export default router;
