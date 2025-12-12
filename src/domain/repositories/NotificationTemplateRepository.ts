import { NotificationTemplate } from "../entities/NotificationTemplate";


export interface NotificationTemplateRepository {
  create(template: NotificationTemplate): Promise<NotificationTemplate>;
  findById(id: string): Promise<NotificationTemplate | null>;
  findByTemplateId(templateId: string): Promise<NotificationTemplate | null>;
  findAll(filters?: { category?: string; status?: string }): Promise<NotificationTemplate[]>;
  findByCategory(category: NotificationTemplate['category']): Promise<NotificationTemplate[]>;
  findActive(): Promise<NotificationTemplate[]>;
  update(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | null>;
  delete(id: string): Promise<boolean>;
}
