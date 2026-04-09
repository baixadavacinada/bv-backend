import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { testUsers, testHealthUnit } from '../fixtures/testData';
import { MongoUserRepository } from '../../src/infrastructure/database/implementations/MongoUserRepository';

describe('Google OAuth Integration & Profile Editing', () => {
  let app: Express;
  let userRepository: MongoUserRepository;

  const googleUserFirebaseUid = 'google-test-user-' + Date.now();
  const googleUserEmail = `google-user-${Date.now()}@gmail.com`;
  const googleUserDisplayName = 'Google Test User';

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = new MongoUserRepository();
  });

  afterEach(async () => {
    // Clean up test user
    try {
      await userRepository.delete(googleUserFirebaseUid);
    } catch (e) {
      // Ignore if user doesn't exist
    }
  });

  describe('Firebase User Sync (Google OAuth)', () => {
    it('should sync a new Google user to MongoDB with isActive=true', async () => {
      const response = await request(app)
        .post('/api/public/auth/sync')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          email: googleUserEmail,
          displayName: googleUserDisplayName
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: googleUserEmail,
        displayName: googleUserDisplayName,
        role: 'public',
        isActive: true
      });

      // Verify user was created in MongoDB with isActive=true
      const mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser).toBeDefined();
      expect(mongoUser?.isActive).toBe(true);
      expect(mongoUser?.name).toBe(googleUserDisplayName);
      expect(mongoUser?.email).toBe(googleUserEmail);
    });

    it('should reactivate an inactive Google user on sync', async () => {
      // Create an inactive user first
      await userRepository.create({
        _id: googleUserFirebaseUid,
        uid: googleUserFirebaseUid,
        name: googleUserDisplayName,
        email: googleUserEmail,
        role: 'public',
        isActive: false,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      // Verify user is inactive
      let mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.isActive).toBe(false);

      // Sync the user
      const response = await request(app)
        .post('/api/public/auth/sync')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          email: googleUserEmail,
          displayName: googleUserDisplayName
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);

      // Verify user is now active in MongoDB
      mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.isActive).toBe(true);
    });

    it('should preserve existing user data during sync', async () => {
      // Create user first
      await userRepository.create({
        _id: googleUserFirebaseUid,
        uid: googleUserFirebaseUid,
        name: googleUserDisplayName,
        email: googleUserEmail,
        role: 'public',
        isActive: true,
        phone: '(21) 99999-9999',
        acceptWhatsAppNotifications: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      // Sync with new displayName
      const newDisplayName = 'Updated Display Name';
      await request(app)
        .post('/api/public/auth/sync')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          email: googleUserEmail,
          displayName: newDisplayName
        })
        .expect(201);

      // Verify phone and whatsapp preference are preserved
      const mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.phone).toBe('(21) 99999-9999');
      expect(mongoUser?.acceptWhatsAppNotifications).toBe(true);
    });
  });

  describe('Profile Editing for Google/All Users', () => {
    beforeEach(async () => {
      // Create a Google user in MongoDB before each test
      await userRepository.create({
        _id: googleUserFirebaseUid,
        uid: googleUserFirebaseUid,
        name: googleUserDisplayName,
        email: googleUserEmail,
        role: 'public',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
    });

    it('should allow Google user to edit their name', async () => {
      const newName = 'Updated Google User Name';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          name: newName
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newName);

      // Verify in database
      const mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.name).toBe(newName);
    });

    it('should allow Google user to edit their phone number', async () => {
      const newPhone = '(21) 98888-7777';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          phone: newPhone
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(newPhone);

      // Verify in database
      const mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.phone).toBe(newPhone);
    });

    it('should allow Google user to enable WhatsApp notifications', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          phone: '(21) 98888-7777',
          acceptWhatsAppNotifications: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.acceptWhatsAppNotifications).toBe(true);

      // Verify in database
      const mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.acceptWhatsAppNotifications).toBe(true);
    });

    it('should reject phone with fewer than 10 digits', async () => {
      const invalidPhone = '1234567'; // Only 7 digits

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          phone: invalidPhone
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
    });

    it('should reject phone with invalid characters', async () => {
      const invalidPhone = '(21) 9@#$%-7777'; // Invalid characters

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({
          phone: invalidPhone
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
    });

    it('should allow phone formats with minimum 10 digits', async () => {
      const validPhoneVariations = [
        '(21) 9888-7777', // 10 digits with formatting
        '2198887777', // 10 digits no formatting
        '(21) 98888-7777', // 11 digits with formatting
        '+55 21 98888-7777', // 11 digits with country code
        '+5521988887777' // 13 digits no formatting
      ];

      for (const phone of validPhoneVariations) {
        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer mock-firebase-user-token`)
          .send({ phone })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.phone).toBe(phone);
      }
    });

    it('should allow updating multiple fields at once', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '(21) 99999-8888',
        acceptWhatsAppNotifications: true,
        displayName: 'Updated Display Name'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.acceptWhatsAppNotifications).toBe(true);

      // Verify all updates in database
      const mongoUser = await userRepository.findById(googleUserFirebaseUid);
      expect(mongoUser?.name).toBe(updateData.name);
      expect(mongoUser?.phone).toBe(updateData.phone);
      expect(mongoUser?.acceptWhatsAppNotifications).toBe(true);
    });

    it('should reject profile update with no fields', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should reject unauthenticated profile update', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Profile retrieval', () => {
    beforeEach(async () => {
      await userRepository.create({
        _id: googleUserFirebaseUid,
        uid: googleUserFirebaseUid,
        name: googleUserDisplayName,
        email: googleUserEmail,
        role: 'public',
        isActive: true,
        phone: '(21) 99999-9999',
        acceptWhatsAppNotifications: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
    });

    it('should retrieve complete profile for Google user', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer mock-firebase-user-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: googleUserEmail,
        name: googleUserDisplayName,
        phone: '(21) 99999-9999',
        acceptWhatsAppNotifications: true,
        role: 'public'
      });
    });
  });
});
