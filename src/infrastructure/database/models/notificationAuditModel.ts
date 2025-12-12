import { Schema, model, Document } from 'mongoose';
import { NotificationAudit } from '../../../domain/entities/NotificationAudit';

export interface NotificationAuditDocument extends Omit<NotificationAudit, '_id' | 'id'>, Document {
  id: string;
}

const notificationAuditSchema = new Schema<NotificationAuditDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Action details
  action: {
    type: String,
    enum: [
      'template_created',
      'template_updated',
      'template_deleted',
      'template_activated',
      'template_deactivated',
      'notification_sent',
      'notification_failed',
      'job_created',
      'job_started',
      'job_completed',
      'job_failed',
      'job_cancelled'
    ],
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['template', 'notification', 'job'],
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  
  // Template info
  templateId: {
    type: String,
    index: true
  },
  templateName: String,
  
  // Job info
  jobId: {
    type: String,
    index: true
  },
  
  // Recipient info
  recipientId: {
    type: String,
    index: true
  },
  recipientName: String,
  recipientPhone: String,
  recipientEmail: String,
  
  // Channel
  channel: {
    type: String,
    enum: ['whatsapp', 'email', 'push', 'sms'],
    index: true
  },
  
  // Content snapshot
  subject: String,
  body: String,
  context: Schema.Types.Mixed,
  
  // Result
  success: {
    type: Boolean,
    required: true,
    index: true
  },
  error: String,
  messageId: String,
  
  // Metadata
  performedBy: {
    type: String,
    required: true,
    index: true
  },
  performedByName: {
    type: String,
    required: true
  },
  performedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Technical details
  requestPayload: Schema.Types.Mixed,
  responsePayload: Schema.Types.Mixed,
  durationMs: Number,
  ipAddress: String,
  userAgent: String
}, {
  collection: 'notification_audits',
  timestamps: false // Using performedAt instead
});

// Indexes for efficient queries
notificationAuditSchema.index({ performedAt: -1 });
notificationAuditSchema.index({ action: 1, performedAt: -1 });
notificationAuditSchema.index({ templateId: 1, performedAt: -1 });
notificationAuditSchema.index({ jobId: 1, performedAt: -1 });
notificationAuditSchema.index({ recipientId: 1, performedAt: -1 });
notificationAuditSchema.index({ channel: 1, success: 1 });
notificationAuditSchema.index({ performedBy: 1, performedAt: -1 });

// Compound indexes for analytics
notificationAuditSchema.index({
  entityType: 1,
  action: 1,
  performedAt: -1
});

notificationAuditSchema.index({
  channel: 1,
  success: 1,
  performedAt: -1
});

// TTL index - auto-delete audits older than 90 days
notificationAuditSchema.index(
  { performedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export const NotificationAuditModel = model<NotificationAuditDocument>(
  'NotificationAudit',
  notificationAuditSchema
);
