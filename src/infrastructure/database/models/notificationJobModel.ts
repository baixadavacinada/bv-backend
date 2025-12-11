/**
 * Mongoose Model for Notification Jobs
 */

import { Schema, model, Document } from 'mongoose';
import { NotificationJob, NotificationRecipient } from '../../../domain/entities/NotificationJob';

export type NotificationJobDocument = Document & NotificationJob;

const recipientSchema = new Schema<NotificationRecipient>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    required: true
  },
  sentAt: Date,
  error: String,
  messageId: String
}, { _id: false });

const recurrenceSchema = new Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  daysOfWeek: [Number],
  dayOfMonth: Number,
  time: { type: String, required: true },
  endDate: Date
}, { _id: false });

const errorSchema = new Schema({
  recipientId: { type: String, required: true },
  error: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
}, { _id: false });

const notificationJobSchema = new Schema<NotificationJobDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  templateId: {
    type: String,
    required: true,
    index: true
  },
  templateName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['immediate', 'scheduled', 'recurring'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    required: true,
    default: 'pending',
    index: true
  },
  
  // Recipients
  recipients: {
    type: [recipientSchema],
    required: true
  },
  recipientMode: {
    type: String,
    enum: ['single', 'broadcast', 'filter'],
    default: 'broadcast'
  },
  totalRecipients: {
    type: Number,
    required: true,
    default: 0
  },
  successCount: {
    type: Number,
    required: true,
    default: 0
  },
  failureCount: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Channels
  channels: {
    type: [String],
    enum: ['email', 'whatsapp', 'push'],
    default: ['whatsapp']
  },
  
  // Content
  context: {
    type: Schema.Types.Mixed,
    required: true,
    default: {}
  },
  renderedSubject: String,
  renderedBody: String,
  
  // Scheduling
  scheduledFor: {
    type: Date,
    index: true
  },
  startedAt: Date,
  completedAt: Date,
  
  // Recurrence
  recurrence: recurrenceSchema,
  
  // Metadata
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  createdByName: {
    type: String,
    required: true
  },
  
  // Errors
  jobErrors: [errorSchema]
}, {
  timestamps: true,
  collection: 'notification_jobs'
});

// Indexes for efficient queries
notificationJobSchema.index({ status: 1, scheduledFor: 1 });
notificationJobSchema.index({ createdBy: 1, createdAt: -1 });
notificationJobSchema.index({ templateId: 1, status: 1 });
notificationJobSchema.index({ type: 1, status: 1 });

// Compound index for scheduler
notificationJobSchema.index({ 
  status: 1, 
  type: 1, 
  scheduledFor: 1 
});

export const NotificationJobModel = model<NotificationJobDocument>(
  'NotificationJob',
  notificationJobSchema
);
