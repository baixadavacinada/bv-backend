/**
 * Notification Audit Repository Interface
 */

import { NotificationAudit, CreateAuditDTO, AuditFilters, AuditStats } from '../entities/NotificationAudit';

export interface NotificationAuditRepository {
  /**
   * Create audit log entry
   */
  create(data: CreateAuditDTO): Promise<NotificationAudit>;
  
  /**
   * Batch create audit entries
   */
  createMany(data: CreateAuditDTO[]): Promise<NotificationAudit[]>;
  
  /**
   * Find audit by ID
   */
  findById(id: string): Promise<NotificationAudit | null>;
  
  /**
   * Find all audits with filters and pagination
   */
  findAll(filters?: AuditFilters, options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: NotificationAudit[];
    total: number;
    hasMore: boolean;
  }>;
  
  /**
   * Find audits by template
   */
  findByTemplate(templateId: string, limit?: number): Promise<NotificationAudit[]>;
  
  /**
   * Find audits by job
   */
  findByJob(jobId: string, limit?: number): Promise<NotificationAudit[]>;
  
  /**
   * Find audits by recipient
   */
  findByRecipient(recipientId: string, limit?: number): Promise<NotificationAudit[]>;
  
  /**
   * Get audit statistics
   */
  getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    templateId?: string;
    performedBy?: string;
  }): Promise<AuditStats>;
  
  /**
   * Delete old audit logs (for cleanup)
   */
  deleteOlderThan(date: Date): Promise<number>;
}
