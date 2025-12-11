/**
 * Notification Job Entity
 * Represents a scheduled or batch notification job
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'immediate' | 'scheduled' | 'recurring';

export interface NotificationRecipient {
  userId: string;
  userName: string;
  phone: string;
  email?: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
  messageId?: string;
}

export interface NotificationJob {
  _id?: string;
  id: string; // UUID
  templateId: string;
  templateName: string;
  type: JobType;
  status: JobStatus;
  
  // Targeting
  recipients: NotificationRecipient[];
  recipientMode?: 'single' | 'broadcast' | 'filter'; // How recipients were selected
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  
  // Channels
  channels?: ('email' | 'whatsapp' | 'push')[];
  
  // Content
  context: Record<string, any>;
  renderedSubject?: string;
  renderedBody?: string;
  
  // Scheduling
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Recurrence (for recurring jobs)
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    time: string; // HH:mm format
    endDate?: Date;
  };
  
  // Metadata
  createdBy: string; // Admin user ID
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Error tracking
  jobErrors?: Array<{
    recipientId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface CreateNotificationJobDTO {
  templateId: string;
  recipients: {
    mode: 'single' | 'broadcast' | 'filter';
    userIds?: string[];
    filter?: {
      role?: 'public' | 'agent' | 'admin';
      acceptWhatsAppNotifications?: boolean;
      hasPhone?: boolean;
    };
  };
  context: Record<string, any>;
  scheduledFor?: Date;
  recurrence?: NotificationJob['recurrence'];
  createdBy: string;
  createdByName: string;
}

export interface NotificationJobFilters {
  status?: JobStatus;
  type?: JobType;
  templateId?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
}
