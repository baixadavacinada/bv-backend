import jwt from 'jsonwebtoken';
import { testUsers } from '../fixtures/testData';

// Mock Firebase ID tokens that will be recognized by our mocks
export const MOCK_FIREBASE_TOKENS = {
  user: 'mock-firebase-user-token',
  admin: 'mock-firebase-admin-token',
};

export function generateTestToken(user: typeof testUsers.admin | typeof testUsers.user): string {
  // For Firebase auth, we'll use mock tokens instead of JWT
  return user.role === 'admin' ? MOCK_FIREBASE_TOKENS.admin : MOCK_FIREBASE_TOKENS.user;
}

export function getAuthHeaders(user: 'admin' | 'user' = 'user') {
  const token = user === 'admin' ? MOCK_FIREBASE_TOKENS.admin : MOCK_FIREBASE_TOKENS.user;
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function getAdminAuthHeaders() {
  return getAuthHeaders('admin');
}

export function getUserAuthHeaders() {
  return getAuthHeaders('user');
}

// Helper to generate actual JWT tokens for legacy JWT auth (if needed)
export function generateJWTToken(user: { id: string; email: string; role: string }) {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: '1h' }
  );
}