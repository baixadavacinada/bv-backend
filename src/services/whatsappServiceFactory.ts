import { Logger } from '../middlewares/logging';
import { ZapiWhatsappService } from './zapiWhatsappService';

export interface IWhatsAppService {
  sendMessage(message: any): Promise<string | null>;
  sendBulkMessages(messages: any[]): Promise<string[]>;
  isConfigured(): boolean;
  getStatus(): any;
}

/**
 * Z-API WhatsApp Service Factory
 * Provides singleton access to Z-API WhatsApp service
 */
export class WhatsAppServiceFactory {
  private static logger = Logger.getInstance();
  private static instance: IWhatsAppService | null = null;

  /**
   * Get the Z-API WhatsApp service instance
   * Creates instance lazily
   */
  static getInstance(): IWhatsAppService {
    if (!this.instance) {
      this.logger.info('Creating Z-API WhatsApp service instance');
      this.instance = new ZapiWhatsappService();
    }

    return this.instance;
  }

  /**
   * Check if Z-API is properly configured
   */
  static isConfigured(): boolean {
    return this.getInstance().isConfigured();
  }

  /**
   * Get health status of Z-API service
   */
  static getStatus() {
    const instance = this.getInstance();
    return {
      provider: 'zapi',
      configured: instance.isConfigured(),
      status: instance.getStatus()
    };
  }
}
