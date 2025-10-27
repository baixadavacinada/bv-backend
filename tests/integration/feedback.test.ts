import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { getAdminAuthHeaders, getUserAuthHeaders } from '../helpers/authHelpers';
import { testHealthUnit, testFeedback } from '../fixtures/testData';

describe('Feedback API Integration Tests', () => {
  let app: Express;
  let healthUnitId: string;
  let feedbackId: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Create test health unit for feedback
    const healthUnitResponse = await request(app)
      .post('/api/admin/health-units')
      .set(getAdminAuthHeaders())
      .send(testHealthUnit);
    healthUnitId = healthUnitResponse.body.data._id;
  });

  describe('POST /api/public/feedback', () => {
    it('should create feedback successfully with user auth', async () => {
      // GIVEN: Authenticated user with valid feedback data
      const feedbackData = {
        ...testFeedback,
        healthUnitId,
      };

      // WHEN: User creates feedback
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(feedbackData)
        .expect(201);

      // THEN: Feedback is created successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        healthUnitId: feedbackData.healthUnitId,
        comment: feedbackData.comment,
        rating: feedbackData.rating,
        isAnonymous: feedbackData.isAnonymous,
        status: 'pending',
      });
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.userId).toBeDefined();
      
      feedbackId = response.body.data._id;
    });

    it('should create anonymous feedback successfully', async () => {
      // GIVEN: User with anonymous feedback data
      const anonymousFeedbackData = {
        ...testFeedback,
        healthUnitId,
        isAnonymous: true,
      };

      // WHEN: User creates anonymous feedback
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(anonymousFeedbackData)
        .expect(201);

      // THEN: Anonymous feedback is created
      expect(response.body.success).toBe(true);
      expect(response.body.data.isAnonymous).toBe(true);
      expect(response.body.data.userId).toBeUndefined();
    });

    it('should reject feedback creation without authentication', async () => {
      // GIVEN: No authentication
      const feedbackData = {
        ...testFeedback,
        healthUnitId,
      };

      // WHEN: Request without auth
      const response = await request(app)
        .post('/api/public/feedback')
        .send(feedbackData)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject feedback with invalid rating', async () => {
      // GIVEN: User with invalid rating (outside 1-5 range)
      const invalidFeedbackData = {
        ...testFeedback,
        healthUnitId,
        rating: 6, // Invalid rating
      };

      // WHEN: User tries to create feedback with invalid rating
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(invalidFeedbackData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject feedback with too short comment', async () => {
      // GIVEN: User with too short comment
      const invalidFeedbackData = {
        ...testFeedback,
        healthUnitId,
        comment: 'ok', // Too short
      };

      // WHEN: User tries to create feedback with short comment
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(invalidFeedbackData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject feedback with non-existent health unit', async () => {
      // GIVEN: User with non-existent health unit ID
      const invalidFeedbackData = {
        ...testFeedback,
        healthUnitId: '507f1f77bcf86cd799439011', // Non-existent ID
      };

      // WHEN: User tries to create feedback for non-existent health unit
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(invalidFeedbackData)
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject feedback with excessively long comment', async () => {
      // GIVEN: User with excessively long comment
      const longComment = 'x'.repeat(1001); // Exceeds 1000 character limit
      const invalidFeedbackData = {
        ...testFeedback,
        healthUnitId,
        comment: longComment,
      };

      // WHEN: User tries to create feedback with long comment
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(invalidFeedbackData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/public/feedback/health-unit/:healthUnitId', () => {
    beforeEach(async () => {
      // Ensure we have feedback for the health unit
      if (!feedbackId) {
        const feedbackData = {
          ...testFeedback,
          healthUnitId,
        };
        const response = await request(app)
          .post('/api/public/feedback')
          .set(getUserAuthHeaders())
          .send(feedbackData);
        feedbackId = response.body.data._id;
      }
    });

    it('should list feedback for health unit without authentication', async () => {
      // GIVEN: Public endpoint for health unit feedback
      
      // WHEN: Public user requests feedback for health unit
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${healthUnitId}`)
        .expect(200);

      // THEN: Feedback list is returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify feedback belongs to the health unit
      response.body.data.forEach((feedback: any) => {
        expect(feedback.healthUnitId).toBe(healthUnitId);
      });
    });

    it('should return empty array for health unit with no feedback', async () => {
      // GIVEN: Health unit with no feedback
      const emptyHealthUnitResponse = await request(app)
        .post('/api/admin/health-units')
        .set(getAdminAuthHeaders())
        .send({ ...testHealthUnit, name: 'Empty Health Unit' });
      const emptyHealthUnitId = emptyHealthUnitResponse.body.data._id;

      // WHEN: Request feedback for health unit with no feedback
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${emptyHealthUnitId}`)
        .expect(200);

      // THEN: Empty array is returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return 404 for non-existent health unit', async () => {
      // GIVEN: Non-existent health unit ID
      const invalidId = '507f1f77bcf86cd799439011';
      
      // WHEN: Request feedback for non-existent health unit
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${invalidId}`)
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid health unit ID format', async () => {
      // GIVEN: Invalid ID format
      const invalidId = 'invalid-id-format';
      
      // WHEN: Request with invalid ID format
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${invalidId}`)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should include average rating in response', async () => {
      // GIVEN: Health unit with feedback
      
      // WHEN: Request feedback for health unit
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${healthUnitId}`)
        .expect(200);

      // THEN: Average rating is included
      expect(response.body.success).toBe(true);
      expect(response.body.averageRating).toBeDefined();
      expect(response.body.averageRating).toBeGreaterThanOrEqual(1);
      expect(response.body.averageRating).toBeLessThanOrEqual(5);
      expect(response.body.total).toBeDefined();
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should exclude user information from anonymous feedback', async () => {
      // GIVEN: Anonymous feedback exists
      const anonymousFeedbackData = {
        ...testFeedback,
        healthUnitId,
        isAnonymous: true,
        comment: 'This is anonymous feedback',
      };
      await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(anonymousFeedbackData);

      // WHEN: Request feedback list
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${healthUnitId}`)
        .expect(200);

      // THEN: Anonymous feedback has no user information
      expect(response.body.success).toBe(true);
      
      const anonymousFeedback = response.body.data.find((f: any) => f.isAnonymous === true);
      expect(anonymousFeedback).toBeDefined();
      expect(anonymousFeedback.userId).toBeUndefined();
      expect(anonymousFeedback.userName).toBeUndefined();
    });
  });

  describe('GET /api/admin/feedback', () => {
    beforeEach(async () => {
      // Ensure we have feedback for admin to manage
      if (!feedbackId) {
        const feedbackData = {
          ...testFeedback,
          healthUnitId,
        };
        const response = await request(app)
          .post('/api/public/feedback')
          .set(getUserAuthHeaders())
          .send(feedbackData);
        feedbackId = response.body.data._id;
      }
    });

    it('should list all feedback with admin auth', async () => {
      // GIVEN: Admin user
      
      // WHEN: Admin requests all feedback
      const response = await request(app)
        .get('/api/admin/feedback')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: All feedback is returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject feedback listing without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User tries to list all feedback
      const response = await request(app)
        .get('/api/admin/feedback')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should filter feedback by health unit', async () => {
      // GIVEN: Admin with health unit filter
      
      // WHEN: Admin requests feedback for specific health unit
      const response = await request(app)
        .get(`/api/admin/feedback?healthUnitId=${healthUnitId}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only feedback for specified health unit is returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((feedback: any) => {
        expect(feedback.healthUnitId).toBe(healthUnitId);
      });
    });

    it('should filter feedback by status', async () => {
      // GIVEN: Admin with status filter
      
      // WHEN: Admin requests pending feedback
      const response = await request(app)
        .get('/api/admin/feedback?status=pending')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only pending feedback is returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((feedback: any) => {
        expect(feedback.status).toBe('pending');
      });
    });

    it('should filter feedback by rating', async () => {
      // GIVEN: Admin with rating filter
      const targetRating = 5;
      
      // WHEN: Admin requests feedback with specific rating
      const response = await request(app)
        .get(`/api/admin/feedback?rating=${targetRating}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only feedback with specified rating is returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((feedback: any) => {
        expect(feedback.rating).toBe(targetRating);
      });
    });

    it('should paginate feedback list', async () => {
      // GIVEN: Admin with pagination parameters
      
      // WHEN: Admin requests paginated feedback
      const response = await request(app)
        .get('/api/admin/feedback?page=1&limit=10')
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

  describe('PATCH /api/admin/feedback/:id/moderate', () => {
    beforeEach(async () => {
      if (!feedbackId) {
        const feedbackData = {
          ...testFeedback,
          healthUnitId,
        };
        const response = await request(app)
          .post('/api/public/feedback')
          .set(getUserAuthHeaders())
          .send(feedbackData);
        feedbackId = response.body.data._id;
      }
    });

    it('should moderate feedback successfully with admin auth', async () => {
      // GIVEN: Admin user with moderation decision
      const moderationData = {
        status: 'approved',
        moderationNotes: 'Feedback aprovado após análise',
      };

      // WHEN: Admin moderates feedback
      const response = await request(app)
        .patch(`/api/admin/feedback/${feedbackId}/moderate`)
        .set(getAdminAuthHeaders())
        .send(moderationData)
        .expect(200);

      // THEN: Feedback is moderated successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.moderationNotes).toBe(moderationData.moderationNotes);
      expect(response.body.data.moderatedAt).toBeDefined();
    });

    it('should reject feedback moderation without admin auth', async () => {
      // GIVEN: Regular user trying to moderate
      const moderationData = {
        status: 'approved',
        moderationNotes: 'Unauthorized moderation attempt',
      };

      // WHEN: User tries to moderate feedback
      const response = await request(app)
        .patch(`/api/admin/feedback/${feedbackId}/moderate`)
        .set(getUserAuthHeaders())
        .send(moderationData)
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject feedback moderation with invalid status', async () => {
      // GIVEN: Admin with invalid status
      const invalidModerationData = {
        status: 'invalid_status',
      };

      // WHEN: Admin tries to set invalid status
      const response = await request(app)
        .patch(`/api/admin/feedback/${feedbackId}/moderate`)
        .set(getAdminAuthHeaders())
        .send(invalidModerationData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject moderation of non-existent feedback', async () => {
      // GIVEN: Non-existent feedback ID
      const invalidId = '507f1f77bcf86cd799439011';
      const moderationData = {
        status: 'approved',
      };

      // WHEN: Admin tries to moderate non-existent feedback
      const response = await request(app)
        .patch(`/api/admin/feedback/${invalidId}/moderate`)
        .set(getAdminAuthHeaders())
        .send(moderationData)
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should allow rejecting feedback with reason', async () => {
      // GIVEN: Admin rejecting feedback with reason
      const rejectionData = {
        status: 'rejected',
        moderationNotes: 'Feedback contém linguagem inapropriada',
      };

      // WHEN: Admin rejects feedback
      const response = await request(app)
        .patch(`/api/admin/feedback/${feedbackId}/moderate`)
        .set(getAdminAuthHeaders())
        .send(rejectionData)
        .expect(200);

      // THEN: Feedback is rejected with reason
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.moderationNotes).toBe(rejectionData.moderationNotes);
    });
  });

  describe('Feedback Analytics Tests', () => {
    beforeEach(async () => {
      // Create multiple feedback entries with different ratings
      const feedbackEntries = [
        { ...testFeedback, healthUnitId, rating: 5, comment: 'Excelente atendimento' },
        { ...testFeedback, healthUnitId, rating: 4, comment: 'Bom atendimento' },
        { ...testFeedback, healthUnitId, rating: 3, comment: 'Atendimento regular' },
        { ...testFeedback, healthUnitId, rating: 2, comment: 'Atendimento ruim' },
        { ...testFeedback, healthUnitId, rating: 1, comment: 'Atendimento péssimo' },
      ];

      await Promise.all(
        feedbackEntries.map(feedback =>
          request(app)
            .post('/api/public/feedback')
            .set(getUserAuthHeaders())
            .send(feedback)
        )
      );
    });

    it('should calculate accurate average rating', async () => {
      // GIVEN: Health unit with multiple feedback ratings
      
      // WHEN: Request feedback with analytics
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${healthUnitId}`)
        .expect(200);

      // THEN: Average rating is calculated correctly
      expect(response.body.success).toBe(true);
      expect(response.body.averageRating).toBeDefined();
      
      // With ratings 1,2,3,4,5 the average should be 3.0
      expect(response.body.averageRating).toBeCloseTo(3.0, 1);
      expect(response.body.total).toBeGreaterThanOrEqual(5);
    });

    it('should include rating distribution in admin view', async () => {
      // GIVEN: Admin requesting detailed feedback analytics
      
      // WHEN: Admin requests feedback with analytics
      const response = await request(app)
        .get(`/api/admin/feedback?healthUnitId=${healthUnitId}&includeAnalytics=true`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Rating distribution is included
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.ratingDistribution).toBeDefined();
      
      // Verify we have feedback for each rating
      [1, 2, 3, 4, 5].forEach(rating => {
        expect(response.body.analytics.ratingDistribution[rating]).toBeGreaterThan(0);
      });
    });
  });

  describe('Feedback Performance Tests', () => {
    it('should handle high volume feedback listing efficiently', async () => {
      // GIVEN: Performance requirement for feedback listing
      const startTime = Date.now();
      
      // WHEN: Request large feedback list
      const response = await request(app)
        .get(`/api/public/feedback/health-unit/${healthUnitId}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      // THEN: Response time should be acceptable
      expect(responseTime).toBeLessThan(2000); // 2 seconds
      expect(response.body.success).toBe(true);
    });

    it('should handle feedback creation with reasonable performance', async () => {
      // GIVEN: Performance requirement for feedback creation
      const feedbackData = {
        ...testFeedback,
        healthUnitId,
        comment: 'Performance test feedback entry',
      };

      const startTime = Date.now();

      // WHEN: Create feedback
      const response = await request(app)
        .post('/api/public/feedback')
        .set(getUserAuthHeaders())
        .send(feedbackData)
        .expect(201);

      const responseTime = Date.now() - startTime;

      // THEN: Creation should be fast
      expect(responseTime).toBeLessThan(1000); // 1 second
      expect(response.body.success).toBe(true);
    });
  });
});