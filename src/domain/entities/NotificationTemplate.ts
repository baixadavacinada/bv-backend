/**
 * Notification Template Entity
 * Represents a reusable template for notifications
 */

export interface NotificationTemplate {
  _id?: string;
  id: string; // Unique identifier (e.g., 'appointment_scheduled')
  name: string; // Display name
  description: string; // What this template is for
  subject: string; // Subject/title with placeholders
  body: string; // Body text with placeholders ({{variable}})
  category: 'appointment' | 'vaccine' | 'reminder' | 'system' | 'general';
  status: 'ativo' | 'desativado';
  roles?: ('public' | 'agent' | 'admin')[]; // Who can receive this notification
  variables?: string[]; // Available variables (e.g., ['userName', 'date'])
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Context for rendering templates
 */
export interface TemplateContext {
  userName?: string;
  vaccineName?: string;
  healthUnitName?: string;
  date?: string;
  time?: string;
  appointmentId?: string;
  doses?: number;
  currentDose?: number;
  phoneNumber?: string;
  email?: string;
  city?: string;
  manufacturer?: string;
  message?: string;
  [key: string]: any;
}
