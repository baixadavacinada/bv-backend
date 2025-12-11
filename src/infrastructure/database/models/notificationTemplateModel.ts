import { Schema, model, Document } from "mongoose";

export interface NotificationTemplateDocument extends Document {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: 'appointment' | 'vaccine' | 'reminder' | 'system' | 'general';
  status: 'ativo' | 'desativado';
  roles?: ('public' | 'agent' | 'admin')[];
  variables?: string[];
  
  // Metadata fields
  trigger?: 'manual' | 'automático' | 'misto';
  triggerDescription?: string;
  requiredVariables?: string[];
  exampleContext?: Record<string, string>;
  usageCount?: number;
  successRate?: number;
  lastUsedAt?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const notificationTemplateSchema = new Schema<NotificationTemplateDocument>(
  {
    id: {
      type: String,
      required: [true, 'Template ID is required'],
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Template name is required']
    },
    description: {
      type: String,
      required: [true, 'Template description is required']
    },
    subject: {
      type: String,
      required: [true, 'Template subject is required']
    },
    body: {
      type: String,
      required: [true, 'Template body is required']
    },
    category: {
      type: String,
      enum: ['appointment', 'vaccine', 'reminder', 'system', 'general'],
      required: [true, 'Template category is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['ativo', 'desativado'],
      default: 'ativo',
      index: true
    },
    roles: {
      type: [String],
      enum: ['public', 'agent', 'admin'],
      default: ['public', 'agent', 'admin']
    },
    variables: {
      type: [String],
      default: []
    },
    // Metadata fields
    trigger: {
      type: String,
      enum: ['manual', 'automático', 'misto'],
      default: 'manual'
    },
    triggerDescription: {
      type: String,
      default: null
    },
    requiredVariables: {
      type: [String],
      default: []
    },
    exampleContext: {
      type: Schema.Types.Mixed,
      default: {}
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'notification_templates'
  }
);

// Index for efficient queries
notificationTemplateSchema.index({ category: 1, status: 1 });

export const NotificationTemplateModel = model<NotificationTemplateDocument>(
  'NotificationTemplate',
  notificationTemplateSchema
);
