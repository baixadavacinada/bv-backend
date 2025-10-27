import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { getAdminAuthHeaders, getUserAuthHeaders } from '../helpers/authHelpers';
import { testNotification } from '../fixtures/testData';

describe('Notifications API Integration Tests', () => {
  let app: Express;
  let notificationId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('POST /api/admin/notifications', () => {
    it('should create notification successfully with admin auth', async () => {
      // GIVEN: Admin user with valid notification data
      const notificationData = {
        ...testNotification,
        userId: 'test-user-uid',
      };

      // WHEN: Admin creates a notification
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(notificationData)
        .expect(201);

      // THEN: Notification is created successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        status: 'pending',
        isRead: false,
      });
      expect(response.body.data._id).toBeDefined();
      
      notificationId = response.body.data._id;
    });

    it('should reject notification creation without admin auth', async () => {
      // GIVEN: Regular user trying to create notification
      const notificationData = {
        ...testNotification,
        userId: 'test-user-uid',
      };

      // WHEN: User tries to create notification
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getUserAuthHeaders())
        .send(notificationData)
        .expect(403);

      // THEN: Request is forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject notification creation with invalid data', async () => {
      // GIVEN: Admin with invalid notification data
      const invalidData = {
        title: '', // Empty title
        message: 'ab', // Too short message
        type: 'invalid_type', // Invalid type
      };

      // WHEN: Admin tries to create notification with invalid data
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(invalidData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject notification creation without authentication', async () => {
      // GIVEN: No authentication
      const notificationData = {
        ...testNotification,
        userId: 'test-user-uid',
      };

      // WHEN: Request without auth
      const response = await request(app)
        .post('/api/admin/notifications')
        .send(notificationData)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should create scheduled notification successfully', async () => {
      // GIVEN: Admin with scheduled notification data
      const scheduledNotificationData = {
        ...testNotification,
        userId: 'test-user-uid',
        scheduledFor: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };

      // WHEN: Admin creates scheduled notification
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(scheduledNotificationData)
        .expect(201);

      // THEN: Scheduled notification is created
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduledFor).toBeDefined();
      expect(response.body.data.status).toBe('scheduled');
    });

    it('should create bulk notification for multiple users', async () => {
      // GIVEN: Admin with bulk notification data
      const bulkNotificationData = {
        ...testNotification,
        userIds: ['test-user-uid', 'another-user-uid'],
        isBulk: true,
      };

      // WHEN: Admin creates bulk notification
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(bulkNotificationData)
        .expect(201);

      // THEN: Bulk notification is created
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(1);
    });
  });

  describe('GET /api/admin/notifications', () => {
    beforeEach(async () => {
      // Ensure we have notifications for admin to list
      if (!notificationId) {
        const notificationData = {
          ...testNotification,
          userId: 'test-user-uid',
        };
        const response = await request(app)
          .post('/api/admin/notifications')
          .set(getAdminAuthHeaders())
          .send(notificationData);
        notificationId = response.body.data._id;
      }
    });

    it('should list all notifications with admin auth', async () => {
      // GIVEN: Admin user
      
      // WHEN: Admin requests notifications list
      const response = await request(app)
        .get('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Notifications are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject listing without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User tries to list all notifications
      const response = await request(app)
        .get('/api/admin/notifications')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should filter notifications by status', async () => {
      // GIVEN: Admin with status filter
      
      // WHEN: Admin requests notifications with status filter
      const response = await request(app)
        .get('/api/admin/notifications?status=pending')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only pending notifications are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((notification: any) => {
        expect(notification.status).toBe('pending');
      });
    });

    it('should filter notifications by type', async () => {
      // GIVEN: Admin with type filter
      
      // WHEN: Admin requests notifications with type filter
      const response = await request(app)
        .get('/api/admin/notifications?type=appointment_reminder')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only appointment reminder notifications are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((notification: any) => {
        expect(notification.type).toBe('appointment_reminder');
      });
    });

    it('should filter notifications by userId', async () => {
      // GIVEN: Admin with userId filter
      const targetUserId = 'test-user-uid';
      
      // WHEN: Admin requests notifications for specific user
      const response = await request(app)
        .get(`/api/admin/notifications?userId=${targetUserId}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only notifications for specified user are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((notification: any) => {
        expect(notification.userId).toBe(targetUserId);
      });
    });

    it('should paginate notifications list', async () => {
      // GIVEN: Admin with pagination parameters
      
      // WHEN: Admin requests paginated notifications
      const response = await request(app)
        .get('/api/admin/notifications?page=1&limit=10')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Paginated results are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
      });
    });
  });

  describe('GET /api/public/notifications', () => {
    beforeEach(async () => {
      // Create notification for the authenticated user
      const notificationData = {
        ...testNotification,
        userId: 'test-user-uid', // This matches the user in auth helpers
      };
      await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(notificationData);
    });

    it('should list user notifications with user auth', async () => {
      // GIVEN: Authenticated user
      
      // WHEN: User requests their notifications
      const response = await request(app)
        .get('/api/public/notifications')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: User notifications are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify all notifications belong to the user
      response.body.data.forEach((notification: any) => {
        expect(notification.userId).toBe('test-user-uid');
      });
    });

    it('should reject listing without authentication', async () => {
      // GIVEN: No authentication
      
      // WHEN: Request without auth
      const response = await request(app)
        .get('/api/public/notifications')
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should filter user notifications by read status', async () => {
      // GIVEN: User with read status filter
      
      // WHEN: User requests unread notifications
      const response = await request(app)
        .get('/api/public/notifications?isRead=false')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Only unread notifications are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((notification: any) => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should filter user notifications by type', async () => {
      // GIVEN: User with type filter
      
      // WHEN: User requests appointment reminder notifications
      const response = await request(app)
        .get('/api/public/notifications?type=appointment_reminder')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Only appointment reminder notifications are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((notification: any) => {
        expect(notification.type).toBe('appointment_reminder');
      });
    });
  });

  describe('PATCH /api/public/notifications/:id/read', () => {
    let userNotificationId: string;

    beforeEach(async () => {
      // Create notification for the user
      const notificationData = {
        ...testNotification,
        userId: 'test-user-uid',
      };
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(notificationData);
      userNotificationId = response.body.data._id;
    });

    it('should mark notification as read with user auth', async () => {
      // GIVEN: User with unread notification
      
      // WHEN: User marks notification as read
      const response = await request(app)
        .patch(`/api/public/notifications/${userNotificationId}/read`)
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Notification is marked as read
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('lida'),
      });
      expect(response.body.data.isRead).toBe(true);
      expect(response.body.data.readAt).toBeDefined();
    });

    it('should reject marking notification as read without auth', async () => {
      // GIVEN: No authentication
      
      // WHEN: Request without auth
      const response = await request(app)
        .patch(`/api/public/notifications/${userNotificationId}/read`)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject marking non-existent notification as read', async () => {
      // GIVEN: Non-existent notification ID
      const invalidId = '507f1f77bcf86cd799439011';
      
      // WHEN: User tries to mark non-existent notification as read
      const response = await request(app)
        .patch(`/api/public/notifications/${invalidId}/read`)
        .set(getUserAuthHeaders())
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle already read notification gracefully', async () => {
      // GIVEN: Notification that is already read
      await request(app)
        .patch(`/api/public/notifications/${userNotificationId}/read`)
        .set(getUserAuthHeaders());

      // WHEN: User tries to mark it as read again
      const response = await request(app)
        .patch(`/api/public/notifications/${userNotificationId}/read`)
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Operation succeeds gracefully
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
    });
  });

  describe('PATCH /api/public/notifications/mark-all-read', () => {
    beforeEach(async () => {
      // Create multiple notifications for the user
      const notificationData = {
        ...testNotification,
        userId: 'test-user-uid',
      };
      
      await Promise.all([
        request(app)
          .post('/api/admin/notifications')
          .set(getAdminAuthHeaders())
          .send({ ...notificationData, title: 'Notification 1' }),
        request(app)
          .post('/api/admin/notifications')
          .set(getAdminAuthHeaders())
          .send({ ...notificationData, title: 'Notification 2' }),
        request(app)
          .post('/api/admin/notifications')
          .set(getAdminAuthHeaders())
          .send({ ...notificationData, title: 'Notification 3' }),
      ]);
    });

    it('should mark all user notifications as read with user auth', async () => {
      // GIVEN: User with multiple unread notifications
      
      // WHEN: User marks all notifications as read
      const response = await request(app)
        .patch('/api/public/notifications/mark-all-read')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: All notifications are marked as read
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('lidas'),
      });
      expect(response.body.data.modifiedCount).toBeGreaterThan(0);

      // Verify all notifications are read
      const notificationsResponse = await request(app)
        .get('/api/public/notifications')
        .set(getUserAuthHeaders());

      notificationsResponse.body.data.forEach((notification: any) => {
        expect(notification.isRead).toBe(true);
      });
    });

    it('should reject mark all as read without authentication', async () => {
      // GIVEN: No authentication
      
      // WHEN: Request without auth
      const response = await request(app)
        .patch('/api/public/notifications/mark-all-read')
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle mark all as read when no unread notifications exist', async () => {
      // GIVEN: User with all notifications already read
      await request(app)
        .patch('/api/public/notifications/mark-all-read')
        .set(getUserAuthHeaders());

      // WHEN: User tries to mark all as read again
      const response = await request(app)
        .patch('/api/public/notifications/mark-all-read')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Operation succeeds gracefully
      expect(response.body.success).toBe(true);
      expect(response.body.data.modifiedCount).toBe(0);
    });
  });

  describe('Notification System Performance Tests', () => {
    it('should handle bulk notification creation efficiently', async () => {
      // GIVEN: Large number of users for bulk notification
      const userIds = Array.from({ length: 100 }, (_, i) => `bulk-user-${i}`);
      const bulkNotificationData = {
        ...testNotification,
        userIds,
        isBulk: true,
        title: 'Bulk Performance Test',
      };

      const startTime = Date.now();

      // WHEN: Admin creates bulk notification
      const response = await request(app)
        .post('/api/admin/notifications')
        .set(getAdminAuthHeaders())
        .send(bulkNotificationData)
        .expect(201);

      const responseTime = Date.now() - startTime;

      // THEN: Bulk creation completes within reasonable time
      expect(responseTime).toBeLessThan(5000); // 5 seconds for 100 notifications
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(userIds.length);
    });

    it('should paginate large notification lists efficiently', async () => {
      // GIVEN: Admin requesting large paginated list
      const startTime = Date.now();
      
      // WHEN: Admin requests first page of notifications
      const response = await request(app)
        .get('/api/admin/notifications?page=1&limit=50')
        .set(getAdminAuthHeaders())
        .expect(200);

      const responseTime = Date.now() - startTime;

      // THEN: Pagination response is fast
      expect(responseTime).toBeLessThan(2000); // 2 seconds
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });
  });
});