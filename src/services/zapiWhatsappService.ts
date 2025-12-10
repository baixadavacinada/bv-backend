import axios, { AxiosInstance } from 'axios';
import { Logger } from '../middlewares/logging';

export interface WhatsAppMessage {
  to: string; // Phone number with country code: +5521987654321
  body: string;
  mediaUrl?: string;
}

export interface WhatsAppDeliveryStatus {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  timestamp: Date;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Z-API WhatsApp Service
 * Uses Z-API provider for WhatsApp message sending
 * 
 * Setup:
 * 1. Create account at https://www.z-api.io/
 * 2. Get your Instance ID from dashboard
 * 3. Get your API Token from dashboard
 * 4. Add to .env: ZAPI_INSTANCE_ID and ZAPI_API_TOKEN
 */
export class ZapiWhatsappService {
  private logger = Logger.getInstance();
  private instanceId: string;
  private apiToken: string;
  private apiClient: AxiosInstance;
  private baseUrl = 'https://api.z-api.io/instances';

  constructor() {
    this.instanceId = process.env.ZAPI_INSTANCE_ID || '';
    this.apiToken = process.env.ZAPI_API_TOKEN || '';

    if (!this.instanceId || !this.apiToken) {
      this.logger.warn('Z-API credentials not fully configured', {
        hasInstanceId: !!this.instanceId,
        hasApiToken: !!this.apiToken
      });
    }

    // Initialize axios client with default headers
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Client-Token': this.apiToken,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Send a WhatsApp message via Z-API
   * @param message Message to send with phone number
   * @returns Message ID if successful, null if failed
   */
  async sendMessage(message: WhatsAppMessage): Promise<string | null> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(message.to)) {
        this.logger.error('Invalid phone number format', {
          phoneNumber: this.maskPhoneNumber(message.to),
          format: 'Expected +[countryCode][number]'
        });
        return null;
      }

      // Validate message body
      if (!message.body || message.body.trim().length === 0) {
        this.logger.error('Empty message body');
        return null;
      }

      if (message.body.length > 1000) {
        this.logger.warn('Message body exceeds 1000 characters, will be truncated', {
          originalLength: message.body.length
        });
      }

      // Extract phone number without + prefix for Z-API
      const phoneNumber = message.to.replace('+', '');

      // Prepare payload
      const payload: any = {
        phone: phoneNumber,
        message: message.body.substring(0, 1000)
      };

      // Add media if provided
      if (message.mediaUrl) {
        payload.urlMedia = message.mediaUrl;
      }

      // Send message via Z-API
      const response = await this.apiClient.post(
        `/${this.instanceId}/token/${this.apiToken}/send-message`,
        payload
      );

      const messageId = response.data?.messageId || response.data?.id || 'unknown';

      this.logger.info('WhatsApp message sent successfully via Z-API', {
        messageId,
        to: this.maskPhoneNumber(message.to),
        status: response.data?.status || 'sent',
        responseData: response.data
      });

      return messageId;
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message via Z-API', error as Error, {
        to: this.maskPhoneNumber(message.to),
        messageLength: message.body.length,
        errorResponse: axios.isAxiosError(error) ? error.response?.data : undefined,
        errorStatus: axios.isAxiosError(error) ? error.response?.status : undefined
      });
      return null;
    }
  }

  /**
   * Send bulk messages
   * @param messages Array of messages to send
   * @returns Array of message IDs
   */
  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<string[]> {
    const results: string[] = [];

    for (const message of messages) {
      const messageId = await this.sendMessage(message);
      if (messageId) {
        results.push(messageId);
      }

      // Add delay between messages to avoid rate limiting
      // Z-API has rate limits, typically 15-30 msgs/second
      await this.delay(100);
    }

    this.logger.info('Bulk WhatsApp messages sent via Z-API', {
      total: messages.length,
      successful: results.length,
      failed: messages.length - results.length
    });

    return results;
  }

  /**
   * Get message status from Z-API
   * Useful for checking delivery status without webhooks
   */
  async getMessageStatus(messageId: string): Promise<WhatsAppDeliveryStatus | null> {
    try {
      const response = await this.apiClient.get(
        `/${this.instanceId}/token/${this.apiToken}/get-message/${messageId}`
      );

      const status = response.data?.status || 'unknown';
      const timestamp = response.data?.timestamp ? new Date(response.data.timestamp) : new Date();

      return {
        messageId,
        status: this.mapZapiStatus(status),
        timestamp,
        errorCode: response.data?.errorCode,
        errorMessage: response.data?.errorMessage
      };
    } catch (error) {
      this.logger.error('Failed to get message status from Z-API', error as Error, {
        messageId
      });
      return null;
    }
  }

  /**
   * Validate phone number format (must be +[countryCode][number])
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+\d{1,3}\d{4,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Mask phone number for logging (show only last 4 digits)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    return phoneNumber.substring(0, phoneNumber.length - 4) + '****';
  }

  /**
   * Helper to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Map Z-API status to internal status format
   */
  private mapZapiStatus(zapiStatus: string): WhatsAppDeliveryStatus['status'] {
    const statusMap: Record<string, WhatsAppDeliveryStatus['status']> = {
      'queued': 'queued',
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed',
      'undelivered': 'undelivered',
      'error': 'failed'
    };
    return statusMap[zapiStatus.toLowerCase()] || 'queued';
  }

  /**
   * Check if Z-API service is properly configured
   */
  isConfigured(): boolean {
    return !!this.instanceId && !!this.apiToken;
  }

  /**
   * Get service health status
   */
  getStatus(): {
    configured: boolean;
    instanceId: boolean;
    apiToken: boolean;
  } {
    return {
      configured: this.isConfigured(),
      instanceId: !!this.instanceId,
      apiToken: !!this.apiToken
    };
  }

  /**
   * Verify Z-API connection by testing API access
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        `/${this.instanceId}/token/${this.apiToken}/get-instance`
      );

      const isConnected = response.status === 200;

      if (isConnected) {
        this.logger.info('Z-API connection verified successfully', {
          instanceId: this.instanceId
        });
      }

      return isConnected;
    } catch (error) {
      this.logger.error('Failed to verify Z-API connection', error as Error);
      return false;
    }
  }
}
