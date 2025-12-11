/**
 * Notification Job Repository Interface
 */

import { NotificationJob, NotificationJobFilters, CreateNotificationJobDTO, JobStatus } from '../entities/NotificationJob';

export interface NotificationJobRepository {
  /**
   * Create a new notification job
   */
  create(data: CreateNotificationJobDTO): Promise<NotificationJob>;
  
  /**
   * Find job by ID
   */
  findById(id: string): Promise<NotificationJob | null>;
  
  /**
   * Find all jobs with optional filters
   */
  findAll(filters?: NotificationJobFilters): Promise<NotificationJob[]>;
  
  /**
   * Find pending jobs (for scheduler)
   */
  findPendingJobs(): Promise<NotificationJob[]>;
  
  /**
   * Find jobs scheduled for execution
   */
  findScheduledJobs(before: Date): Promise<NotificationJob[]>;
  
  /**
   * Update job status
   */
  updateStatus(id: string, status: JobStatus): Promise<NotificationJob | null>;
  
  /**
   * Update job progress
   */
  updateProgress(id: string, data: {
    successCount?: number;
    failureCount?: number;
    startedAt?: Date;
    completedAt?: Date;
    status?: JobStatus;
  }): Promise<NotificationJob | null>;
  
  /**
   * Update recipient status
   */
  updateRecipientStatus(jobId: string, recipientId: string, data: {
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
    messageId?: string;
  }): Promise<void>;
  
  /**
   * Add error to job
   */
  addError(jobId: string, error: {
    recipientId: string;
    error: string;
    timestamp: Date;
  }): Promise<void>;
  
  /**
   * Cancel job
   */
  cancel(id: string): Promise<NotificationJob | null>;
  
  /**
   * Delete job
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Get job statistics
   */
  getStats(filters?: { startDate?: Date; endDate?: Date; templateId?: string }): Promise<{
    total: number;
    byStatus: Record<JobStatus, number>;
    successRate: number;
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
  }>;
}
