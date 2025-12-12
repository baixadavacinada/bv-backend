import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoNotificationJobRepository } from '../../src/infrastructure/database/implementations/MongoNotificationJobRepository';
import { MongoNotificationAuditRepository } from '../../src/infrastructure/database/implementations/MongoNotificationAuditRepository';
import { MongoNotificationTemplateRepository } from '../../src/infrastructure/database/implementations/MongoNotificationTemplateRepository';
import { NotificationTemplateModel } from '../../src/infrastructure/database/models/notificationTemplateModel';
import { NotificationJobModel } from '../../src/infrastructure/database/models/notificationJobModel';
import { NotificationAuditModel } from '../../src/infrastructure/database/models/notificationAuditModel';

describe('SendTemplateNotification Database Persistence Tests', () => {
  let jobRepository: MongoNotificationJobRepository;
  let auditRepository: MongoNotificationAuditRepository;
  let templateRepository: MongoNotificationTemplateRepository;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/baixada-vacinada-test';
    
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to test database');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }

    // Initialize repositories
    jobRepository = new MongoNotificationJobRepository();
    auditRepository = new MongoNotificationAuditRepository();
    templateRepository = new MongoNotificationTemplateRepository();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await NotificationJobModel.deleteMany({});
    await NotificationAuditModel.deleteMany({});
    await NotificationTemplateModel.deleteMany({});
  });

  describe('Database Persistence', () => {
    it('should save notification template to database', async () => {
      const template = {
        id: 'test-template-1',
        name: 'Test Template',
        description: 'A test template',
        subject: 'Test Subject',
        body: 'Hello {{name}}, this is a test',
        category: 'general' as const,
        status: 'ativo' as const,
        variables: ['name'],
        trigger: 'manual' as const,
        usageCount: 0,
        successRate: 0
      };

      const saved = await templateRepository.create(template);

      expect(saved).toBeDefined();
      expect(saved.id).toBe(template.id);
      expect(saved.name).toBe(template.name);

      // Verify it's in the database
      const retrieved = await templateRepository.findByTemplateId(template.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(template.name);
    });

    it('should save notification job to database', async () => {
      const job = {
        templateId: 'test-template',
        recipients: {
          mode: 'single' as const,
          userIds: ['user-1']
        },
        context: { name: 'Test User' },
        createdBy: 'admin-user',
        createdByName: 'Admin'
      };

      const created = await jobRepository.create(job);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.templateId).toBe(job.templateId);

      // Verify it's in the database
      const retrieved = await jobRepository.findById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.templateId).toBe(job.templateId);
    });

    it('should save audit log to database', async () => {
      const audit = {
        action: 'job_created' as const,
        entityType: 'job' as const,
        entityId: 'job-123',
        templateId: 'template-1',
        templateName: 'Test Template',
        jobId: 'job-123',
        channel: 'whatsapp' as const,
        success: true,
        performedBy: 'admin-user',
        performedByName: 'Admin User'
      };

      const created = await auditRepository.create(audit);

      expect(created).toBeDefined();
      expect(created.action).toBe(audit.action);

      // Verify it's in the database
      const retrieved = await auditRepository.findAll({ jobId: 'job-123' });
      expect(retrieved.data.length).toBeGreaterThan(0);
      expect(retrieved.data[0].action).toBe(audit.action);
    });
  });

  describe('Job Status Tracking', () => {
    it('should update job status from pending to processing to completed', async () => {
      const jobData = {
        templateId: 'test-template',
        recipients: {
          mode: 'broadcast' as const
        },
        context: {},
        createdBy: 'admin-user',
        createdByName: 'Admin'
      };

      const job = await jobRepository.create(jobData);
      let retrieved = await jobRepository.findById(job.id);
      expect(retrieved?.status).toBe('pending');

      // Update to processing
      await jobRepository.updateStatus(job.id, 'processing');
      retrieved = await jobRepository.findById(job.id);
      expect(retrieved?.status).toBe('processing');

      // Update to completed
      await jobRepository.updateStatus(job.id, 'completed');
      retrieved = await jobRepository.findById(job.id);
      expect(retrieved?.status).toBe('completed');
    });

    it('should track recipient status changes', async () => {
      const jobData = {
        templateId: 'test-template',
        recipients: {
          mode: 'single' as const,
          userIds: ['user-1']
        },
        context: {},
        createdBy: 'admin-user',
        createdByName: 'Admin'
      };

      const job = await jobRepository.create(jobData);

      // Add recipient with pending status
      await jobRepository.updateRecipientStatus(job.id, 'user-1', {
        status: 'pending'
      });

      let retrieved = await jobRepository.findById(job.id);
      expect(retrieved?.recipients).toBeDefined();

      // Update recipient to sent
      await jobRepository.updateRecipientStatus(job.id, 'user-1', {
        status: 'sent',
        sentAt: new Date(),
        messageId: 'msg-123'
      });

      retrieved = await jobRepository.findById(job.id);
      const recipient = retrieved?.recipients.find((r: any) => r.userId === 'user-1');
      expect(recipient?.status).toBe('sent');
      expect(recipient?.messageId).toBe('msg-123');
    });
  });

  describe('Statistics', () => {
    it('should calculate job statistics', async () => {
      // Create a few jobs
      for (let i = 0; i < 3; i++) {
        const job = await jobRepository.create({
          templateId: 'test-template',
          recipients: { mode: 'broadcast' as const },
          context: {},
          createdBy: 'admin-user',
          createdByName: 'Admin'
        });

        await jobRepository.updateStatus(job.id, 'completed');
      }

      const stats = await jobRepository.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byStatus['completed']).toBe(3);
    });

    it('should calculate audit statistics', async () => {
      // Create audit logs
      for (let i = 0; i < 5; i++) {
        await auditRepository.create({
          action: 'notification_sent',
          entityType: 'notification' as const,
          entityId: `msg-${i}`,
          templateId: 'template-1',
          templateName: 'Test Template',
          jobId: 'job-1',
          channel: 'whatsapp',
          success: true,
          performedBy: 'system',
          performedByName: 'System'
        });
      }

      const stats = await auditRepository.getStats();
      expect(stats.totalActions).toBeGreaterThanOrEqual(5);
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });
});
