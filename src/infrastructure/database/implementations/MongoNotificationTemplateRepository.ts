import { NotificationTemplate } from "../../../domain/entities/NotificationTemplate";
import { NotificationTemplateRepository } from "../../../domain/repositories/NotificationTemplateRepository";
import { NotificationTemplateModel } from "../models/notificationTemplateModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoNotificationTemplateRepository implements NotificationTemplateRepository {
  async create(template: NotificationTemplate): Promise<NotificationTemplate> {
    const created = await NotificationTemplateModel.create(template);
    return convertObjectIdToString<typeof created, NotificationTemplate>(created);
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const template = await NotificationTemplateModel.findById(id).lean();
    return template ? convertLeanDocumentToString<NotificationTemplate>(template) : null;
  }

  async findByTemplateId(templateId: string): Promise<NotificationTemplate | null> {
    const template = await NotificationTemplateModel.findOne({ id: templateId }).lean();
    return template ? convertLeanDocumentToString<NotificationTemplate>(template) : null;
  }

  async findAll(filters?: { category?: string; status?: string }): Promise<NotificationTemplate[]> {
    const query: any = {};
    
    if (filters?.category) {
      query.category = filters.category;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const templates = await NotificationTemplateModel.find(query)
      .sort({ category: 1, name: 1 })
      .lean();
    
    return convertLeanArrayToString<NotificationTemplate>(templates);
  }

  async findByCategory(category: NotificationTemplate['category']): Promise<NotificationTemplate[]> {
    const templates = await NotificationTemplateModel.find({ category })
      .sort({ name: 1 })
      .lean();
    
    return convertLeanArrayToString<NotificationTemplate>(templates);
  }

  async findActive(): Promise<NotificationTemplate[]> {
    const templates = await NotificationTemplateModel.find({ status: 'ativo' })
      .sort({ category: 1, name: 1 })
      .lean();
    
    return convertLeanArrayToString<NotificationTemplate>(templates);
  }

  async update(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    const updated = await NotificationTemplateModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    
    return updated ? convertLeanDocumentToString<NotificationTemplate>(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await NotificationTemplateModel.findByIdAndDelete(id);
    return result !== null;
  }
}
