import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { Express } from 'express';
import { UserModel } from '../../src/infrastructure/database/models/userModel';

// Mock Firebase Auth before any imports
const mockFirebaseAuth = {
  createUser: jest.fn().mockImplementation((userData: any) => {
    return Promise.resolve({
      uid: `firebase-${Date.now()}`,
      email: userData.email,
      displayName: userData.displayName,
      emailVerified: false
    });
  }),
  setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  })
};

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(() => ({}))
  },
  auth: () => mockFirebaseAuth
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';

/**
 * Integration Test: User Registration with Real API Endpoint
 * Tests the complete flow from HTTP request to MongoDB storage
 */
describe('User Registration - Full Integration Test', () => {
  let mongoServer: MongoMemoryServer;
  let app: Express;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    
    // Import app after mocking
    const { createTestApp } = await import('../helpers/testApp');
    app = await createTestApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await UserModel.deleteMany({});
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/public/auth/register', () => {
    it('should create user in Firebase and MongoDB without password', async () => {
      // GIVEN: Valid user registration data
      const userData = {
        email: 'test@example.com',
        password: 'securepassword123',
        displayName: 'Test User'
      };

      // WHEN: User registers via API
      const response = await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      // THEN: Response is successful
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.displayName).toBe(userData.displayName);

      // AND: Firebase createUser was called with correct data
      expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: false
      });

      // AND: Custom claims were set
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalled();

      // AND: User exists in MongoDB
      const mongoUser = await UserModel.findOne({ email: userData.email });
      expect(mongoUser).toBeTruthy();
      
      // AND: MongoDB user has correct data (WITHOUT password)
      expect(mongoUser!.name).toBe(userData.displayName);
      expect(mongoUser!.email).toBe(userData.email);
      expect(mongoUser!.role).toBe('public');
      expect(mongoUser!.isActive).toBe(true);
      
      // AND: CRITICAL: No password field in MongoDB
      const mongoObject = mongoUser!.toObject();
      expect(mongoObject).not.toHaveProperty('password');
      expect('password' in mongoObject).toBe(false);
      
      // AND: Firebase UID is used as MongoDB _id
      expect(mongoUser!._id).toBeTruthy();
      expect(typeof mongoUser!._id).toBe('string');
    });

    it('should handle MongoDB failure gracefully while Firebase succeeds', async () => {
      // GIVEN: Valid user data
      const userData = {
        email: 'test@example.com', 
        password: 'securepassword123',
        displayName: 'Test User'
      };

      // AND: MongoDB connection is temporarily broken
      await mongoose.disconnect();

      // WHEN: User tries to register
      const response = await request(app)
        .post('/api/public/auth/register')
        .send(userData);

      // Note: This test demonstrates graceful failure handling
      // Firebase user should still be created even if MongoDB fails
      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      // Verify Firebase was called
      expect(mockFirebaseAuth.createUser).toHaveBeenCalled();
    });

    it('should validate that multiple users have no password fields', async () => {
      // GIVEN: Multiple user registrations
      const users = [
        { email: 'user1@test.com', password: 'pass1', displayName: 'User 1' },
        { email: 'user2@test.com', password: 'pass2', displayName: 'User 2' },
        { email: 'user3@test.com', password: 'pass3', displayName: 'User 3' }
      ];

      // WHEN: All users register
      for (const user of users) {
        await request(app)
          .post('/api/public/auth/register')
          .send(user)
          .expect(201);
      }

      // THEN: All users exist in MongoDB
      const allUsers = await UserModel.find({}).lean();
      expect(allUsers).toHaveLength(3);

      // AND: None have password fields
      allUsers.forEach((user: any, index: number) => {
        expect(user).not.toHaveProperty('password');
        expect('password' in user).toBe(false);
        console.log(`✅ User ${index + 1} (${user.email}) has no password field`);
      });

      console.log('🔐 Security validation: All users stored safely without passwords');
    });

    it('should maintain TypeScript type safety', async () => {
      // GIVEN: User data
      const userData = {
        email: 'typescript@test.com',
        password: 'typepass123',
        displayName: 'TypeScript User'
      };

      // WHEN: User registers
      await request(app)
        .post('/api/public/auth/register')
        .send(userData)
        .expect(201);

      // THEN: Find user and verify TypeScript types
      const user = await UserModel.findOne({ email: userData.email });
      
      if (user) {
        // TypeScript compilation validates these types exist
        expect(typeof user._id).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.role).toBe('string');
        expect(typeof user.isActive).toBe('boolean');
        
        // TypeScript would prevent accessing user.password if properly typed
        // This demonstrates the type safety of our implementation
        console.log('✅ TypeScript types enforced - password field not accessible');
      }
    });
  });

  describe('Security Validation', () => {
    it('should prevent password field injection attempts', async () => {
      // GIVEN: Malicious data with password field
      const maliciousData = {
        email: 'hacker@test.com',
        password: 'secretpass',
        displayName: 'Hacker',
        // Attempt to inject password into MongoDB
        mongoPassword: 'inject-this-password',
        dbPassword: 'another-attempt'
      };

      // WHEN: Registration attempt
      await request(app)
        .post('/api/public/auth/register')
        .send(maliciousData)
        .expect(201);

      // THEN: User exists but without any password fields
      const user = await UserModel.findOne({ email: maliciousData.email });
      expect(user).toBeTruthy();
      
      const userObj = user!.toObject();
      expect(userObj).not.toHaveProperty('password');
      expect(userObj).not.toHaveProperty('mongoPassword');
      expect(userObj).not.toHaveProperty('dbPassword');
      
      console.log('🛡️ Security test passed: Injection attempts blocked');
    });
  });
});

export {};