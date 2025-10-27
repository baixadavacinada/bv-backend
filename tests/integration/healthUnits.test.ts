import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { getAdminAuthHeaders, getUserAuthHeaders } from '../helpers/authHelpers';
import { testHealthUnit } from '../fixtures/testData';

describe('Health Units API Integration Tests', () => {
  let app: Express;
  let healthUnitId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('POST /api/admin/health-units', () => {
    it('should create a health unit successfully with admin auth', async () => {
      // GIVEN: Admin user with valid health unit data
      const healthUnitData = { ...testHealthUnit };

      // WHEN: Admin creates a health unit
      const response = await request(app)
        .post('/api/admin/health-units')
        .set(getAdminAuthHeaders())
        .send(healthUnitData);

      // Debug output
      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(201);

      // THEN: Health unit is created successfully
      expect(response.body).toMatchObject({
        message: expect.stringContaining('sucesso'),
        data: expect.objectContaining({
          name: healthUnitData.name,
          address: healthUnitData.address,
          neighborhood: healthUnitData.neighborhood,
          city: healthUnitData.city,
          state: healthUnitData.state,
          zipCode: healthUnitData.zipCode,
          isActive: true,
        })
      });
      expect(response.body.data._id).toBeDefined();
      
      // Store ID for subsequent tests
      healthUnitId = response.body.data._id;
    });

    it('should reject health unit creation without admin auth', async () => {
      // GIVEN: Regular user trying to create health unit
      const healthUnitData = { ...testHealthUnit };

      // WHEN: User tries to create health unit
      const response = await request(app)
        .post('/api/admin/health-units')
        .set(getUserAuthHeaders())
        .send(healthUnitData)
        .expect(403);

      // THEN: Request is forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('should reject health unit creation with invalid data', async () => {
      // GIVEN: Admin with invalid health unit data (missing required fields)
      const invalidData = {
        name: '', // Empty name
        address: {}, // Incomplete address
      };

      // WHEN: Admin tries to create health unit with invalid data
      const response = await request(app)
        .post('/api/admin/health-units')
        .set(getAdminAuthHeaders())
        .send(invalidData)
        .expect(400);

      // THEN: Request is rejected with validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject health unit creation without authentication', async () => {
      // GIVEN: No authentication headers
      const healthUnitData = { ...testHealthUnit };

      // WHEN: Request is made without auth
      const response = await request(app)
        .post('/api/admin/health-units')
        .send(healthUnitData)
        .expect(401);

      // THEN: Request is unauthorized
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/public/health-units', () => {
    beforeEach(async () => {
      // Ensure we have a health unit for testing
      if (!healthUnitId) {
        const response = await request(app)
          .post('/api/admin/health-units')
          .set(getAdminAuthHeaders())
          .send(testHealthUnit);
        healthUnitId = response.body.data._id;
      }
    });

    it('should list all active health units without authentication', async () => {
      // GIVEN: Public endpoint for listing health units
      
      // WHEN: Public user requests health units list
      const response = await request(app)
        .get('/api/public/health-units')
        .expect(200);

      // THEN: Health units are returned successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const healthUnit = response.body.data.find((hu: any) => hu._id === healthUnitId);
      expect(healthUnit).toBeDefined();
      expect(healthUnit.name).toBe(testHealthUnit.name);
    });

    it('should filter health units by city', async () => {
      // GIVEN: Health units in database
      
      // WHEN: Request with city filter
      const response = await request(app)
        .get('/api/public/health-units?city=Japeri')
        .expect(200);

      // THEN: Only health units from specified city are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((hu: any) => {
        expect(hu.address.city).toBe('Japeri');
      });
    });
  });

  describe('GET /api/public/health-units/:id', () => {
    beforeEach(async () => {
      if (!healthUnitId) {
        const response = await request(app)
          .post('/api/admin/health-units')
          .set(getAdminAuthHeaders())
          .send(testHealthUnit);
        healthUnitId = response.body.data._id;
      }
    });

    it('should get health unit by ID successfully', async () => {
      // GIVEN: Valid health unit ID
      
      // WHEN: Request specific health unit
      const response = await request(app)
        .get(`/api/public/health-units/${healthUnitId}`)
        .expect(200);

      // THEN: Health unit details are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data._id).toBe(healthUnitId);
      expect(response.body.data.name).toBe(testHealthUnit.name);
    });

    it('should return 404 for non-existent health unit', async () => {
      // GIVEN: Invalid health unit ID
      const invalidId = '507f1f77bcf86cd799439011';
      
      // WHEN: Request non-existent health unit
      const response = await request(app)
        .get(`/api/public/health-units/${invalidId}`)
        .expect(404);

      // THEN: Not found error is returned
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should return 400 for invalid health unit ID format', async () => {
      // GIVEN: Invalid ID format
      const invalidId = 'invalid-id';
      
      // WHEN: Request with invalid ID format
      const response = await request(app)
        .get(`/api/public/health-units/${invalidId}`)
        .expect(400);

      // THEN: Bad request error is returned
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/admin/health-units/:id', () => {
    beforeEach(async () => {
      if (!healthUnitId) {
        const response = await request(app)
          .post('/api/admin/health-units')
          .set(getAdminAuthHeaders())
          .send(testHealthUnit);
        healthUnitId = response.body.data._id;
      }
    });

    it('should update health unit successfully with admin auth', async () => {
      // GIVEN: Admin user with valid update data
      const updateData = {
        name: 'UBS Centro de Teste - Atualizada',
        capacity: 150,
        services: ['Vacinação COVID-19', 'Vacinação Influenza', 'Pediatria'],
      };

      // WHEN: Admin updates health unit
      const response = await request(app)
        .put(`/api/admin/health-units/${healthUnitId}`)
        .set(getAdminAuthHeaders())
        .send(updateData)
        .expect(200);

      // THEN: Health unit is updated successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.capacity).toBe(updateData.capacity);
      expect(response.body.data.services).toEqual(updateData.services);
    });

    it('should reject update without admin auth', async () => {
      // GIVEN: Regular user trying to update
      const updateData = { name: 'Unauthorized Update' };

      // WHEN: User tries to update health unit
      const response = await request(app)
        .put(`/api/admin/health-units/${healthUnitId}`)
        .set(getUserAuthHeaders())
        .send(updateData)
        .expect(403);

      // THEN: Request is forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/admin/health-units/:id', () => {
    let deletableHealthUnitId: string;

    beforeEach(async () => {
      // Create a health unit specifically for deletion test
      const response = await request(app)
        .post('/api/admin/health-units')
        .set(getAdminAuthHeaders())
        .send({ ...testHealthUnit, name: 'UBS Para Deletar' });
      deletableHealthUnitId = response.body.data._id;
    });

    it('should delete health unit successfully with admin auth', async () => {
      // GIVEN: Admin user and existing health unit
      
      // WHEN: Admin deletes health unit
      const response = await request(app)
        .delete(`/api/admin/health-units/${deletableHealthUnitId}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Health unit is deleted (soft delete - isActive = false)
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });

      // Verify health unit is no longer active
      const getResponse = await request(app)
        .get(`/api/public/health-units/${deletableHealthUnitId}`)
        .expect(404); // Should not be found in public endpoints
    });

    it('should reject deletion without admin auth', async () => {
      // GIVEN: Regular user trying to delete
      
      // WHEN: User tries to delete health unit
      const response = await request(app)
        .delete(`/api/admin/health-units/${deletableHealthUnitId}`)
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Request is forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});