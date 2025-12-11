/**
 * Notification Audit Entity
 * Complete audit trail for all notification activities
 */

export type AuditAction = 
  | 'template_created'
  | 'template_updated'
  | 'template_deleted'
  | 'template_activated'
  | 'template_deactivated'
  | 'notification_sent'
  | 'notification_failed'
  | 'job_created'
  | 'job_started'
  | 'job_completed'
  | 'job_failed'
  | 'job_cancelled';

export type AuditChannel = 'whatsapp' | 'email' | 'push' | 'sms';

export interface NotificationAudit {
  _id?: string;
  id: string; // UUID
  
  // Action details
  action: AuditAction;
  entityType: 'template' | 'notification' | 'job';
  entityId: string;
  
  // Template info (if applicable)
  templateId?: string;
  templateName?: string;
  
  // Job info (if applicable)
  jobId?: string;
  
  // Recipient info (for individual sends)
  recipientId?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  
  // Channel
  channel?: AuditChannel;
  
  // Content snapshot
  subject?: string;
  body?: string;
  context?: Record<string, any>;
  
  // Result
  success: boolean;
  error?: string;
  messageId?: string; // External service message ID (Z-API, etc)
  
  // Metadata
  performedBy: string; // User ID or 'system'
  performedByName: string;
  performedAt: Date;
  
  // Technical details
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  durationMs?: number;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateAuditDTO {
  action: AuditAction;
  entityType: NotificationAudit['entityType'];
  entityId: string;
  templateId?: string;
  templateName?: string;
  jobId?: string;
  recipientId?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  channel?: AuditChannel;
  subject?: string;
  body?: string;
  context?: Record<string, any>;
  success: boolean;
  error?: string;
  messageId?: string;
  performedBy: string;
  performedByName: string;
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditFilters {
  action?: AuditAction;
  entityType?: NotificationAudit['entityType'];
  entityId?: string;
  templateId?: string;
  jobId?: string;
  recipientId?: string;
  channel?: AuditChannel;
  success?: boolean;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditStats {
  totalActions: number;
  successRate: number;
  byAction: Record<AuditAction, number>;
  byChannel: Record<AuditChannel, number>;
  byTemplate: Array<{ templateId: string; templateName: string; count: number }>;
  recentActivity: NotificationAudit[];
}
