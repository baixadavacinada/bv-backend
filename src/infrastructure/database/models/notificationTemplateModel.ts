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
