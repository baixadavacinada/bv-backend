import mongoose from 'mongoose';

beforeEach(async () => {
  // Clear all collections before each test for clean state
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  // Ensure all connections are closed
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import './mocks/firebase'; // Import Firebase mocks first

// Mock the Firebase config module specifically
jest.mock('../src/config/firebase', () => ({
  getFirebaseAuth: jest.fn(() => ({
    verifyIdToken: jest.fn((token: string) => {
      if (token.includes('admin')) {
        return Promise.resolve({
          uid: 'test-admin-id',
          email: 'admin@test.com',
          admin: true,
          customClaims: { admin: true },
        });
      } else if (token.includes('user')) {
        return Promise.resolve({
          uid: 'test-user-id',
          email: 'user@test.com',
          admin: false,
          customClaims: {},
        });
      } else {
        return Promise.reject(new Error('Invalid token'));
      }
    }),
    getUser: jest.fn((uid: string) => {
      if (uid === 'test-admin-id') {
        return Promise.resolve({
          uid: 'test-admin-id',
          email: 'admin@test.com',
          displayName: 'Test Admin',
          emailVerified: true,
          customClaims: { admin: true },
        });
      } else if (uid === 'test-user-id') {
        return Promise.resolve({
          uid: 'test-user-id',
          email: 'user@test.com',
          displayName: 'Test User',
          emailVerified: true,
          customClaims: {},
        });
      } else {
        return Promise.reject(new Error('User not found'));
      }
    }),
    createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
    setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
  })),
  initializeFirebase: jest.fn(),
  getFirebaseApp: jest.fn(() => ({})),
}));

// Suppress console logs during tests (disabled for debug)
beforeEach(() => {
  // jest.spyOn(console, 'log').mockImplementation(() => {});
  // jest.spyOn(console, 'info').mockImplementation(() => {});
  // jest.spyOn(console, 'warn').mockImplementation(() => {});
  // jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Clean up database after each test
afterEach(async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
  }
});

const originalConsole = console;
beforeAll(() => {
  if (process.env.VERBOSE_TESTS !== 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
  }
});

afterAll(() => {
  if (process.env.VERBOSE_TESTS !== 'true') {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
  }
});