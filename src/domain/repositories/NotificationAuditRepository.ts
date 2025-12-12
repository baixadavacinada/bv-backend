import { NotificationAudit, CreateAuditDTO, AuditFilters, AuditStats } from '../entities/NotificationAudit';

export interface NotificationAuditRepository {
  create(data: CreateAuditDTO): Promise<NotificationAudit>;
  
  createMany(data: CreateAuditDTO[]): Promise<NotificationAudit[]>;

  findById(id: string): Promise<NotificationAudit | null>;
  
  
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

  
  findByTemplate(templateId: string, limit?: number): Promise<NotificationAudit[]>;
  

  findByJob(jobId: string, limit?: number): Promise<NotificationAudit[]>;
    

  findByRecipient(recipientId: string, limit?: number): Promise<NotificationAudit[]>;

  getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    templateId?: string;
    performedBy?: string;
  }): Promise<AuditStats>;
  
  deleteOlderThan(date: Date): Promise<number>;
}
