import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { UserModel } from '../../src/infrastructure/database/models/userModel';

describe('User Registration - MongoDB Integration Test', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    // Clean up test users
    await UserModel.deleteMany({ email: { $regex: /@test\.com$/ } });
  });

  describe('POST /api/public/auth/register', () => {
    it('should create user in both Firebase and MongoDB', async () => {
      // GIVEN: Valid user registration data
      const userData = {
        email: 'testuser@test.com',
        password: 'password123',
        displayName: 'Test User'
      };

      // WHEN: User registers
      const response = await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      // THEN: User is created successfully
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        uid: expect.any(String),
        email: userData.email,
        displayName: userData.displayName,
        emailVerified: false
      });

      // AND: User is saved in MongoDB
      const mongoUser = await UserModel.findOne({ email: userData.email });
      expect(mongoUser).toBeTruthy();
      expect(mongoUser?.name).toBe(userData.displayName);
      expect(mongoUser?.email).toBe(userData.email);
      expect(mongoUser?.role).toBe('public');
      expect(mongoUser?.isActive).toBe(true);
      
      // Firebase UID should match MongoDB _id
      expect(mongoUser?._id.toString()).toBe(response.body.data.uid);
    });

    it('should handle MongoDB save failure gracefully', async () => {
      // GIVEN: User data that might cause MongoDB issues
      const userData = {
        email: 'testuser2@test.com',
        password: 'password123',
        displayName: 'Test User 2'
      };

      // Temporarily mock UserRepository to simulate MongoDB failure
      const originalCreate = require('../../src/infrastructure/database/implementations/MongoUserRepository').MongoUserRepository.prototype.create;
      require('../../src/infrastructure/database/implementations/MongoUserRepository').MongoUserRepository.prototype.create = jest.fn().mockRejectedValue(new Error('MongoDB connection failed'));

      // WHEN: User registers
      const response = await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201); // Should still succeed even if MongoDB fails

      // THEN: Firebase user is still created
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);

      // Restore original function
      require('../../src/infrastructure/database/implementations/MongoUserRepository').MongoUserRepository.prototype.create = originalCreate;
    });
  });

  describe('Database Consistency Check', () => {
    it('should verify that user exists in MongoDB after registration', async () => {
      // GIVEN: User registration
      const userData = {
        email: 'consistency@test.com',
        password: 'password123',
        displayName: 'Consistency Test User'
      };

      // WHEN: User registers
      await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      // THEN: User can be found in MongoDB
      const mongoUser = await UserModel.findOne({ email: userData.email });
      expect(mongoUser).toBeTruthy();
      
      // AND: User has correct default values
      expect(mongoUser?.role).toBe('public');
      expect(mongoUser?.isActive).toBe(true);
      // Password is not stored in MongoDB for security (Firebase handles auth)
      expect(mongoUser?.toObject()).not.toHaveProperty('password');
      
      // AND: Timestamps are set
      expect(mongoUser?.createdAt).toBeTruthy();
      expect(mongoUser?.updatedAt).toBeTruthy();
    });

    it('should count users correctly after multiple registrations', async () => {
      // GIVEN: Initial user count
      const initialCount = await UserModel.countDocuments();

      // WHEN: Multiple users register
      const users = [
        { email: 'user1@test.com', password: 'pass123', displayName: 'User 1' },
        { email: 'user2@test.com', password: 'pass123', displayName: 'User 2' },
        { email: 'user3@test.com', password: 'pass123', displayName: 'User 3' }
      ];

      for (const user of users) {
        await request(app)
          .post('/api/public/auth/register')
          .send(user)
          .expect(201);
      }

      // THEN: User count increases correctly
      const finalCount = await UserModel.countDocuments();
      expect(finalCount).toBe(initialCount + users.length);

      // AND: All users exist in database
      for (const user of users) {
        const mongoUser = await UserModel.findOne({ email: user.email });
        expect(mongoUser).toBeTruthy();
        expect(mongoUser?.name).toBe(user.displayName);
      }
    });
  });
});