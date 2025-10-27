import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';

describe('Basic API Test', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    console.log('Health check response:', response.body);
    expect(response.body.success).toBe(true);
  });

  it('should test admin authentication', async () => {
    const response = await request(app)
      .post('/api/admin/health-units')
      .set({
        'Authorization': 'Bearer mock-firebase-admin-token',
        'Content-Type': 'application/json'
      })
      .send({
        name: 'Test Health Unit',
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'RJ',
          zipCode: '12345-678'
        },
        contact: {
          phone: '(21) 1234-5678',
          email: 'test@example.com'
        }
      });

    console.log('Admin endpoint response status:', response.status);
    console.log('Admin endpoint response body:', JSON.stringify(response.body, null, 2));
  });
});