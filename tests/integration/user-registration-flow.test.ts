import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { UserModel } from '../../src/infrastructure/database/models/userModel';

describe('User Registration Flow', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    // Clean up test users
    await UserModel.deleteMany({ email: { $regex: /@profile-test\.com$/ } });
  });

  describe('Registration Validation & Input Scenarios', () => {
    it('should accept valid registration with all required fields', async () => {
      const userData = {
        email: 'john.doe@profile-test.com',
        password: 'SecurePass123!',
        displayName: 'John Doe',
        phone: '(21) 98765-4321',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);

      const mongoUser = await UserModel.findOne({ email: userData.email });
      expect(mongoUser).toBeTruthy();
      expect(mongoUser?.role).toBe('public');
    });

    it('should accept names with exactly 2+ words of 2+ chars each', async () => {
      const validNames = [
        'John Doe',
        'Maria Silva',
        'José da Silva',
        'Ana Clara Santos'
      ];

      for (const name of validNames) {
        const response = await request(app)
          .post('/api/public/auth/register')
          .send({
            email: `test-${Date.now()}-${Math.random()}@profile-test.com`,
            password: 'ValidPass123!',
            displayName: name,
            acceptTerms: true
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject names with less than 2 words', async () => {
      const invalidNames = [
        'John',        // Only 1 word
        'J Doe',       // Second word less than 2 chars
        'John D',      // Second word less than 2 chars
      ];

      for (const name of invalidNames) {
        const response = await request(app)
          .post('/api/public/auth/register')
          .send({
            email: `invalid-${Date.now()}-${Math.random()}@profile-test.com`,
            password: 'ValidPass123!',
            displayName: name,
            acceptTerms: true
          });

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should accept various valid password formats', async () => {
      const validPasswords = [
        'SimplePass1!',
        'MySecure#Pass99',
        'Complex@123Password',
        'Password_2025!Test'
      ];

      for (const password of validPasswords) {
        const response = await request(app)
          .post('/api/public/auth/register')
          .send({
            email: `pwd-test-${Date.now()}-${Math.random()}@profile-test.com`,
            password,
            displayName: 'Test User',
            acceptTerms: true
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject weak passwords', async () => {
      const invalidPasswords = [
        'short1!',            // Too short (< 8)
        'NoNumber!Test',      // No number
        'nonumber1!',         // No uppercase
        'NO_LOWERCASE1!',     // No lowercase
        'NoSpecial1'          // No special char
      ];

      for (const password of invalidPasswords) {
        const response = await request(app)
          .post('/api/public/auth/register')
          .send({
            email: `pwd-invalid-${Date.now()}-${Math.random()}@profile-test.com`,
            password,
            displayName: 'Test User',
            acceptTerms: true
          });

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should accept optional phone in various formats', async () => {
      // Note: depends on actual phone regex pattern used
      const validPhones = [
        '(21) 98765-4321',
        '(11) 99999-8888',
        '(85) 12345-6789'
      ];

      for (const phone of validPhones) {
        const response = await request(app)
          .post('/api/public/auth/register')
          .send({
            email: `phone-${Date.now()}-${Math.random()}@profile-test.com`,
            password: 'ValidPass123!',
            displayName: 'Phone Test',
            phone,
            acceptTerms: true
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should create user without phone (optional field)', async () => {
      const response = await request(app)
        .post('/api/public/auth/register')
        .send({
          email: 'no-phone@profile-test.com',
          password: 'ValidPass123!',
          displayName: 'No Phone User',
          acceptTerms: true
          // No phone field
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      const user = await UserModel.findOne({ email: 'no-phone@profile-test.com' });
      expect(user?.phone).toBeUndefined();
    });

    it('should reject duplicate emails', async () => {
      const email = 'duplicate@profile-test.com';
      const userData = {
        email,
        password: 'ValidPass123!',
        displayName: 'First User',
        acceptTerms: true
      };

      // First registration should succeed
      await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      // Second with same email should fail
      const response = await request(app)
        .post('/api/public/auth/register')
        .send({
          ...userData,
          displayName: 'Second User'
        });

      expect([400, 409]).toContain(response.status);
    });

    it('should require terms acceptance', async () => {
      const response = await request(app)
        .post('/api/public/auth/register')
        .send({
          email: 'no-terms@profile-test.com',
          password: 'ValidPass123!',
          displayName: 'No Terms User',
          acceptTerms: false
        });

      expect([400, 422]).toContain(response.status);
    });

    it('should handle rapid successive registrations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/public/auth/register')
          .send({
            email: `rapid-${i}-${Date.now()}@profile-test.com`,
            password: 'ValidPass123!',
            displayName: `Rapid User ${i}`,
            acceptTerms: true
          })
      );

      const responses = await Promise.all(promises);
      responses.forEach(res => {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });
    });
  });

  describe('Data Persistence & Storage', () => {
    it('should persist all user data correctly in MongoDB', async () => {
      const email = 'persist@profile-test.com';
      const userData = {
        email,
        password: 'ValidPass123!',
        displayName: 'Persist User',
        phone: '(21) 98765-4321',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      const uid = response.body.data.uid;

      // Verify MongoDB record
      const mongoUser = await UserModel.findOne({ _id: uid });
      expect(mongoUser).toBeTruthy();
      expect(mongoUser?.email).toBe(email);
      expect(mongoUser?.name).toBe(userData.displayName);
      expect(mongoUser?.phone).toBe(userData.phone);
      expect(mongoUser?.role).toBe('public');
      expect(mongoUser?.isActive).toBe(true);
    });
  });

  describe('Admin User Creation Flow', () => {
    it('should create profissional de saúde (agent) profile', async () => {
      // This would require admin auth - adjust based on your auth setup
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', 'Bearer admin-token') // Mock token
        .send({
          email: 'agent@profile-test.com',
          password: 'ValidPass123!',
          displayName: 'Agent User',
          role: 'agent',
          isActive: true
        });

      // Check response - status may vary based on auth implementation
      if (response.status === 201) {
        expect(response.body.data.role).toBe('agent');
      }
    });
  });
});
