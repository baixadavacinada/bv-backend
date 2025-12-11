/**
 * Admin Notification Routes (Template-Based)
 * Routes for sending notifications using templates, jobs, and audit
 */

import { Router } from 'express';
import { requireAdmin } from '../../middlewares/firebaseAuth';
import * as controller from '../controllers/admin/templateNotificationController';

const router = Router();

// All routes require admin authentication
router.use(requireAdmin);

/**
 * POST /api/admin/notifications/send-template
 * Send notification using a template
 * Body: { templateId, recipients: { mode, userIds?, filter? }, context?, scheduledFor? }
 */
router.post('/send-template', controller.sendTemplateNotification);

/**
 * GET /api/admin/notifications/jobs
 * List all notification jobs with filters
 * Query: ?status=pending&type=scheduled&templateId=xxx&startDate=xxx&endDate=xxx
 */
router.get('/jobs', controller.listJobs);

/**
 * GET /api/admin/notifications/jobs/stats
 * Get job statistics
 * Query: ?startDate=xxx&endDate=xxx&templateId=xxx
 */
router.get('/jobs/stats', controller.getJobStats);

/**
 * GET /api/admin/notifications/jobs/:id
 * Get specific job details
 */
router.get('/jobs/:id', controller.getJob);

/**
 * POST /api/admin/notifications/jobs/:id/cancel
 * Cancel a pending job
 */
router.post('/jobs/:id/cancel', controller.cancelJob);

/**
 * GET /api/admin/notifications/audit
 * Get audit logs with filters
 * Query: ?action=xxx&entityType=xxx&templateId=xxx&jobId=xxx&recipientId=xxx
 *        &channel=whatsapp&success=true&performedBy=xxx&startDate=xxx&endDate=xxx
 *        &limit=50&offset=0
 */
router.get('/audit', controller.getAuditLogs);

/**
 * GET /api/admin/notifications/audit/stats
 * Get audit statistics
 * Query: ?startDate=xxx&endDate=xxx&templateId=xxx&performedBy=xxx
 */
router.get('/audit/stats', controller.getAuditStats);

/**
 * GET /api/admin/notifications/preview-recipients
 * Preview recipients that would receive the notification
 * Query: ?mode=single&userIds=id1,id2 OR ?mode=filter&filter={...}
 */
router.get('/preview-recipients', controller.previewRecipients);

export default router;
