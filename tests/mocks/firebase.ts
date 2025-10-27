// Firebase Admin SDK Mock
const mockFirebaseAuth = {
  verifyIdToken: jest.fn((token: string) => {
    // Mock different users based on token
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
  createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
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
  setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
};

const mockFirebaseApp = {
  auth: () => mockFirebaseAuth,
};

// Mock the firebase-admin module completely
jest.doMock('firebase-admin', () => ({
  __esModule: true,
  default: {
    initializeApp: jest.fn(() => mockFirebaseApp),
    credential: {
      cert: jest.fn(() => ({})),
    },
    auth: () => mockFirebaseAuth,
  },
  initializeApp: jest.fn(() => mockFirebaseApp),
  credential: {
    cert: jest.fn(() => ({})),
  },
  auth: () => mockFirebaseAuth,
}));

// Export mock functions for use in tests
export { mockFirebaseAuth, mockFirebaseApp };