/**
 * Notification Templates Service - Database Version
 * Provides standardized message templates loaded from MongoDB
 * Replaces the old hardcoded templates service
 */

import { NotificationTemplate, TemplateContext } from "../domain/entities/NotificationTemplate";
import { MongoNotificationTemplateRepository } from "../infrastructure/database/implementations/MongoNotificationTemplateRepository";
import { Logger } from "../middlewares/logging";

export class NotificationTemplatesService {
  private repository: MongoNotificationTemplateRepository;
  private logger = Logger.getInstance();
  private cache: Map<string, NotificationTemplate> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor() {
    this.repository = new MongoNotificationTemplateRepository();
  }

  /**
   * Get template by ID from database (with caching)
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    try {
      await this.refreshCacheIfNeeded();
      
      const template = this.cache.get(templateId);
      if (template) {
        return template;
      }

      // If not in cache, fetch directly
      const dbTemplate = await this.repository.findByTemplateId(templateId);
      if (dbTemplate) {
        this.cache.set(templateId, dbTemplate);
      }
      
      return dbTemplate;
    } catch (error) {
      this.logger.error('Failed to get template', error as Error, { templateId });
      return null;
    }
  }

  /**
   * Render template with context variables
   */
  async render(templateId: string, context: TemplateContext = {}): Promise<{ subject: string; body: string } | null> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        this.logger.warn('Template not found', { templateId });
        return null;
      }

      return {
        subject: this.interpolate(template.subject, context),
        body: this.interpolate(template.body, context)
      };
    } catch (error) {
      this.logger.error('Failed to render template', error as Error, { templateId });
      return null;
    }
  }

  /**
   * Interpolate template variables with context
   * Example: "Olá {{userName}}" with context { userName: "João" } = "Olá João"
   */
  private interpolate(text: string, context: TemplateContext): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }

  /**
   * Get all templates by category
   */
  async getTemplatesByCategory(category: NotificationTemplate['category']): Promise<NotificationTemplate[]> {
    try {
      return await this.repository.findByCategory(category);
    } catch (error) {
      this.logger.error('Failed to get templates by category', error as Error, { category });
      return [];
    }
  }

  /**
   * List all available templates
   */
  async listAll(filters?: { category?: string; status?: string }): Promise<NotificationTemplate[]> {
    try {
      return await this.repository.findAll(filters);
    } catch (error) {
      this.logger.error('Failed to list templates', error as Error, { filters });
      return [];
    }
  }

  /**
   * List only active templates
   */
  async listActive(): Promise<NotificationTemplate[]> {
    try {
      return await this.repository.findActive();
    } catch (error) {
      this.logger.error('Failed to list active templates', error as Error);
      return [];
    }
  }

  /**
   * Create new template
   */
  async createTemplate(template: NotificationTemplate): Promise<NotificationTemplate | null> {
    try {
      // Extract variables from subject and body
      const subjectVars = NotificationTemplatesService.extractVariables(template.subject);
      const bodyVars = NotificationTemplatesService.extractVariables(template.body);
      template.variables = [...new Set([...subjectVars, ...bodyVars])];

      const created = await this.repository.create(template);
      this.clearCache();
      return created;
    } catch (error) {
      this.logger.error('Failed to create template', error as Error, { templateId: template.id });
      return null;
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    try {
      // Update variables if subject or body changed
      if (data.subject || data.body) {
        const subjectVars = data.subject ? NotificationTemplatesService.extractVariables(data.subject) : [];
        const bodyVars = data.body ? NotificationTemplatesService.extractVariables(data.body) : [];
        data.variables = [...new Set([...subjectVars, ...bodyVars])];
      }

      const updated = await this.repository.update(id, data);
      this.clearCache();
      return updated;
    } catch (error) {
      this.logger.error('Failed to update template', error as Error, { id });
      return null;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const deleted = await this.repository.delete(id);
      this.clearCache();
      return deleted;
    } catch (error) {
      this.logger.error('Failed to delete template', error as Error, { id });
      return false;
    }
  }

  /**
   * Refresh cache if expired
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheExpiry) {
      await this.refreshCache();
    }
  }

  /**
   * Refresh cache with all templates
   */
  private async refreshCache(): Promise<void> {
    try {
      const templates = await this.repository.findAll();
      this.cache.clear();
      
      templates.forEach(template => {
        this.cache.set(template.id, template);
      });
      
      this.lastCacheUpdate = Date.now();
      this.logger.info('Template cache refreshed', { count: templates.length });
    } catch (error) {
      this.logger.error('Failed to refresh template cache', error as Error);
    }
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Extract variables from template string
   */
  static extractVariables(text: string): string[] {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))];
  }
}

// Export singleton instance
export const notificationTemplatesService = new NotificationTemplatesService();
