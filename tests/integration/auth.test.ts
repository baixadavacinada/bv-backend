import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { getAdminAuthHeaders, getUserAuthHeaders } from '../helpers/authHelpers';
import { testUsers } from '../fixtures/testData';

describe('User Authentication API Integration Tests', () => {
  let app: Express;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user successfully with Firebase token', async () => {
      // GIVEN: Valid Firebase authentication token
      const loginData = {
        firebaseToken: 'valid-firebase-token', // Mocked in test setup
      };

      // WHEN: User logs in with Firebase token
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // THEN: Authentication successful with JWT token
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        token: expect.any(String),
        user: expect.objectContaining({
          uid: expect.any(String),
          email: expect.any(String),
          role: expect.any(String),
        }),
      });
      expect(response.body.data.refreshToken).toBeDefined();
      
      userId = response.body.data.user.uid;
    });

    it('should reject login with invalid Firebase token', async () => {
      // GIVEN: Invalid Firebase token
      const invalidLoginData = {
        firebaseToken: 'invalid-token',
      };

      // WHEN: User tries to login with invalid token
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(401);

      // THEN: Authentication fails
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject login without Firebase token', async () => {
      // GIVEN: No Firebase token provided
      const emptyLoginData = {};

      // WHEN: User tries to login without token
      const response = await request(app)
        .post('/api/auth/login')
        .send(emptyLoginData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create user profile on first login', async () => {
      // GIVEN: New user Firebase token (first time login)
      const newUserLoginData = {
        firebaseToken: 'new-user-token',
      };

      // WHEN: New user logs in for the first time
      const response = await request(app)
        .post('/api/auth/login')
        .send(newUserLoginData)
        .expect(200);

      // THEN: User profile is created automatically
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        uid: expect.any(String),
        email: expect.any(String),
        role: 'user', // Default role for new users
        isFirstLogin: true,
      });
    });

    it('should handle admin user login correctly', async () => {
      // GIVEN: Admin Firebase token
      const adminLoginData = {
        firebaseToken: 'admin-token',
      };

      // WHEN: Admin logs in
      const response = await request(app)
        .post('/api/auth/login')
        .send(adminLoginData)
        .expect(200);

      // THEN: Admin role is assigned
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.user.permissions).toContain('manage_health_units');
      expect(response.body.data.user.permissions).toContain('view_appointments');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Get a valid refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ firebaseToken: 'valid-firebase-token' });
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token successfully', async () => {
      // GIVEN: Valid refresh token
      const refreshData = {
        refreshToken,
      };

      // WHEN: User refreshes token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      // THEN: New tokens are provided
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
      });
      
      // New tokens should be different from the old ones
      expect(response.body.data.token).not.toBe(refreshToken);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      // GIVEN: Invalid refresh token
      const invalidRefreshData = {
        refreshToken: 'invalid-refresh-token',
      };

      // WHEN: User tries to refresh with invalid token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send(invalidRefreshData)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject refresh without token', async () => {
      // GIVEN: No refresh token provided
      const emptyRefreshData = {};

      // WHEN: User tries to refresh without token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send(emptyRefreshData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      // GIVEN: Authenticated user
      
      // WHEN: User logs out
      const response = await request(app)
        .post('/api/auth/logout')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Logout successful
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
    });

    it('should reject logout without authentication', async () => {
      // GIVEN: No authentication
      
      // WHEN: Unauthenticated request to logout
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      // GIVEN: Authenticated user
      
      // WHEN: User requests their profile
      const response = await request(app)
        .get('/api/auth/profile')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Profile is returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        uid: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        displayName: expect.any(String),
      });
    });

    it('should reject profile request without authentication', async () => {
      // GIVEN: No authentication
      
      // WHEN: Unauthenticated request for profile
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should include user permissions in admin profile', async () => {
      // GIVEN: Authenticated admin user
      
      // WHEN: Admin requests their profile
      const response = await request(app)
        .get('/api/auth/profile')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Admin permissions are included
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
      expect(response.body.data.permissions).toContain('manage_health_units');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      // GIVEN: Authenticated user with update data
      const updateData = {
        displayName: 'Updated Display Name',
        phoneNumber: '+5511999999999',
        preferences: {
          notifications: true,
          language: 'pt-BR',
        },
      };

      // WHEN: User updates their profile
      const response = await request(app)
        .put('/api/auth/profile')
        .set(getUserAuthHeaders())
        .send(updateData)
        .expect(200);

      // THEN: Profile is updated successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        displayName: updateData.displayName,
        phoneNumber: updateData.phoneNumber,
        preferences: updateData.preferences,
      });
    });

    it('should reject profile update without authentication', async () => {
      // GIVEN: No authentication
      const updateData = {
        displayName: 'Unauthorized Update',
      };

      // WHEN: Unauthenticated update request
      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate profile update data', async () => {
      // GIVEN: Invalid profile update data
      const invalidUpdateData = {
        email: 'invalid-email-format', // Can't update email directly
        role: 'admin', // Can't self-promote to admin
      };

      // WHEN: User tries to update with invalid data
      const response = await request(app)
        .put('/api/auth/profile')
        .set(getUserAuthHeaders())
        .send(invalidUpdateData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate phone number format', async () => {
      // GIVEN: Invalid phone number format
      const invalidPhoneData = {
        phoneNumber: 'invalid-phone',
      };

      // WHEN: User updates with invalid phone
      const response = await request(app)
        .put('/api/auth/profile')
        .set(getUserAuthHeaders())
        .send(invalidPhoneData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list all users with admin auth', async () => {
      // GIVEN: Admin user
      
      // WHEN: Admin requests user list
      const response = await request(app)
        .get('/api/admin/users')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: User list is returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject user listing without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User tries to list all users
      const response = await request(app)
        .get('/api/admin/users')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should filter users by role', async () => {
      // GIVEN: Admin with role filter
      
      // WHEN: Admin requests users with specific role
      const response = await request(app)
        .get('/api/admin/users?role=user')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only users with specified role are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('user');
      });
    });

    it('should paginate user list', async () => {
      // GIVEN: Admin with pagination parameters
      
      // WHEN: Admin requests paginated user list
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
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

  describe('PATCH /api/admin/users/:id/role', () => {
    let targetUserId: string;

    beforeEach(async () => {
      // Create a test user to update
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ firebaseToken: 'test-user-token' });
      targetUserId = loginResponse.body.data.user.uid;
    });

    it('should update user role with admin auth', async () => {
      // GIVEN: Admin user updating another user's role
      const roleUpdateData = {
        role: 'moderator',
        permissions: ['manage_feedback'],
      };

      // WHEN: Admin updates user role
      const response = await request(app)
        .patch(`/api/admin/users/${targetUserId}/role`)
        .set(getAdminAuthHeaders())
        .send(roleUpdateData)
        .expect(200);

      // THEN: User role is updated successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data.role).toBe('moderator');
      expect(response.body.data.permissions).toContain('manage_feedback');
    });

    it('should reject role update without admin auth', async () => {
      // GIVEN: Regular user trying to update roles
      const roleUpdateData = {
        role: 'admin',
      };

      // WHEN: User tries to update role
      const response = await request(app)
        .patch(`/api/admin/users/${targetUserId}/role`)
        .set(getUserAuthHeaders())
        .send(roleUpdateData)
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid role assignment', async () => {
      // GIVEN: Admin with invalid role
      const invalidRoleData = {
        role: 'super_admin', // Non-existent role
      };

      // WHEN: Admin tries to assign invalid role
      const response = await request(app)
        .patch(`/api/admin/users/${targetUserId}/role`)
        .set(getAdminAuthHeaders())
        .send(invalidRoleData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject role update for non-existent user', async () => {
      // GIVEN: Non-existent user ID
      const invalidUserId = 'non-existent-user-id';
      const roleUpdateData = {
        role: 'moderator',
      };

      // WHEN: Admin tries to update non-existent user
      const response = await request(app)
        .patch(`/api/admin/users/${invalidUserId}/role`)
        .set(getAdminAuthHeaders())
        .send(roleUpdateData)
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Authentication Middleware Tests', () => {
    it('should accept valid JWT token', async () => {
      // GIVEN: Valid JWT token in Authorization header
      
      // WHEN: Request with valid token
      const response = await request(app)
        .get('/api/auth/profile')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Request is authorized
      expect(response.body.success).toBe(true);
    });

    it('should reject expired JWT token', async () => {
      // GIVEN: Expired JWT token
      const expiredHeaders = {
        'Authorization': 'Bearer expired-jwt-token',
      };

      // WHEN: Request with expired token
      const response = await request(app)
        .get('/api/auth/profile')
        .set(expiredHeaders)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject malformed JWT token', async () => {
      // GIVEN: Malformed JWT token
      const malformedHeaders = {
        'Authorization': 'Bearer malformed.token',
      };

      // WHEN: Request with malformed token
      const response = await request(app)
        .get('/api/auth/profile')
        .set(malformedHeaders)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request without Authorization header', async () => {
      // GIVEN: No Authorization header
      
      // WHEN: Request without auth header
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Role-Based Access Control Tests', () => {
    it('should allow admin access to admin endpoints', async () => {
      // GIVEN: Admin user
      
      // WHEN: Admin accesses admin endpoint
      const response = await request(app)
        .get('/api/admin/users')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Access is granted
      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin endpoints', async () => {
      // GIVEN: Regular user
      
      // WHEN: User tries to access admin endpoint
      const response = await request(app)
        .get('/api/admin/users')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Access is denied
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow authenticated users access to public endpoints', async () => {
      // GIVEN: Authenticated user
      
      // WHEN: User accesses public endpoint
      const response = await request(app)
        .get('/api/auth/profile')
        .set(getUserAuthHeaders())
        .expect(200);

      // THEN: Access is granted
      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should protect against token tampering', async () => {
      // GIVEN: Tampered JWT token
      const tamperedToken = getUserAuthHeaders().Authorization.replace(/.$/, 'X'); // Change last character
      const tamperedHeaders = {
        'Authorization': tamperedToken,
      };

      // WHEN: Request with tampered token
      const response = await request(app)
        .get('/api/auth/profile')
        .set(tamperedHeaders)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should prevent role escalation attacks', async () => {
      // GIVEN: User trying to self-promote to admin
      const escalationData = {
        role: 'admin',
        permissions: ['all'],
      };

      // WHEN: User tries to update their own role
      const response = await request(app)
        .put('/api/auth/profile')
        .set(getUserAuthHeaders())
        .send(escalationData)
        .expect(400);

      // THEN: Validation prevents role escalation
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should rate limit authentication attempts', async () => {
      // GIVEN: Multiple rapid authentication attempts
      const invalidLoginData = {
        firebaseToken: 'invalid-token',
      };

      // WHEN: Multiple rapid failed login attempts
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/auth/login')
          .send(invalidLoginData)
      );

      const responses = await Promise.all(promises);

      // THEN: Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});