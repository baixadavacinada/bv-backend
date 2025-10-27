import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { getAdminAuthHeaders, getUserAuthHeaders } from '../helpers/authHelpers';
import { testHealthUnit, testVaccine, testAppointment } from '../fixtures/testData';

describe('Appointments API Integration Tests', () => {
  let app: Express;
  let healthUnitId: string;
  let vaccineId: string;
  let appointmentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Create test health unit
    const healthUnitResponse = await request(app)
      .post('/api/admin/health-units')
      .set(getAdminAuthHeaders())
      .send(testHealthUnit);
    healthUnitId = healthUnitResponse.body.data._id;

    // Create test vaccine (assuming we have this endpoint)
    const vaccineResponse = await request(app)
      .post('/api/admin/vaccines')
      .set(getAdminAuthHeaders())
      .send(testVaccine);
    vaccineId = vaccineResponse.body.data?._id || 'mock-vaccine-id';
  });

  describe('POST /api/public/appointments', () => {
    it('should schedule appointment successfully with user auth', async () => {
      // GIVEN: Authenticated user with valid appointment data
      const appointmentData = {
        ...testAppointment,
        healthUnitId,
        vaccineId,
      };

      // WHEN: User schedules an appointment
      const response = await request(app)
        .post('/api/public/appointments')
        .set(getUserAuthHeaders())
        .send(appointmentData)
        .expect(201);

      // THEN: Appointment is created successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        healthUnitId: appointmentData.healthUnitId,
        vaccineId: appointmentData.vaccineId,
        status: 'scheduled',
        notes: appointmentData.notes,
      });
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.residentId).toBeDefined();
      
      appointmentId = response.body.data._id;
    });

    it('should reject appointment scheduling without authentication', async () => {
      // GIVEN: No authentication headers
      const appointmentData = {
        ...testAppointment,
        healthUnitId,
        vaccineId,
      };

      // WHEN: Request is made without auth
      const response = await request(app)
        .post('/api/public/appointments')
        .send(appointmentData)
        .expect(401);

      // THEN: Request is unauthorized
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject appointment with invalid health unit ID', async () => {
      // GIVEN: Invalid health unit ID
      const appointmentData = {
        ...testAppointment,
        healthUnitId: '507f1f77bcf86cd799439011', // Non-existent ID
        vaccineId,
      };

      // WHEN: User tries to schedule with invalid health unit
      const response = await request(app)
        .post('/api/public/appointments')
        .set(getUserAuthHeaders())
        .send(appointmentData)
        .expect(404);

      // THEN: Health unit not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should reject appointment with invalid date format', async () => {
      // GIVEN: Invalid date format
      const appointmentData = {
        ...testAppointment,
        healthUnitId,
        vaccineId,
        appointmentDate: 'invalid-date',
      };

      // WHEN: User tries to schedule with invalid date
      const response = await request(app)
        .post('/api/public/appointments')
        .set(getUserAuthHeaders())
        .send(appointmentData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject appointment in the past', async () => {
      // GIVEN: Past date
      const appointmentData = {
        ...testAppointment,
        healthUnitId,
        vaccineId,
        appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      // WHEN: User tries to schedule in the past
      const response = await request(app)
        .post('/api/public/appointments')
        .set(getUserAuthHeaders())
        .send(appointmentData)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/public/appointments/available-slots', () => {
    it('should get available slots for a specific date and health unit', async () => {
      // GIVEN: Valid health unit and date
      const date = new Date();
      date.setDate(date.getDate() + 1); // Tomorrow
      const dateString = date.toISOString().split('T')[0];

      // WHEN: Request available slots
      const response = await request(app)
        .get(`/api/public/appointments/available-slots?healthUnitId=${healthUnitId}&date=${dateString}`)
        .expect(200);

      // THEN: Available slots are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject request without required parameters', async () => {
      // GIVEN: Missing required parameters
      
      // WHEN: Request without healthUnitId and date
      const response = await request(app)
        .get('/api/public/appointments/available-slots')
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return empty slots for non-existent health unit', async () => {
      // GIVEN: Non-existent health unit ID
      const date = new Date();
      date.setDate(date.getDate() + 1);
      const dateString = date.toISOString().split('T')[0];

      // WHEN: Request slots for non-existent health unit
      const response = await request(app)
        .get(`/api/public/appointments/available-slots?healthUnitId=507f1f77bcf86cd799439011&date=${dateString}`)
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/public/appointments/:id/cancel', () => {
    beforeEach(async () => {
      // Create an appointment for cancellation tests
      if (!appointmentId) {
        const appointmentData = {
          ...testAppointment,
          healthUnitId,
          vaccineId,
        };
        const response = await request(app)
          .post('/api/public/appointments')
          .set(getUserAuthHeaders())
          .send(appointmentData);
        appointmentId = response.body.data._id;
      }
    });

    it('should cancel appointment successfully with user auth', async () => {
      // GIVEN: User with valid appointment and cancellation reason
      const cancellationData = {
        reason: 'Não poderei comparecer devido a compromisso de trabalho',
      };

      // WHEN: User cancels appointment
      const response = await request(app)
        .patch(`/api/public/appointments/${appointmentId}/cancel`)
        .set(getUserAuthHeaders())
        .send(cancellationData)
        .expect(200);

      // THEN: Appointment is cancelled successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('cancelado'),
      });
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should reject cancellation without authentication', async () => {
      // GIVEN: No authentication
      const cancellationData = {
        reason: 'Some reason',
      };

      // WHEN: Request without auth
      const response = await request(app)
        .patch(`/api/public/appointments/${appointmentId}/cancel`)
        .send(cancellationData)
        .expect(401);

      // THEN: Unauthorized error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject cancellation of non-existent appointment', async () => {
      // GIVEN: Non-existent appointment ID
      const invalidId = '507f1f77bcf86cd799439011';

      // WHEN: Try to cancel non-existent appointment
      const response = await request(app)
        .patch(`/api/public/appointments/${invalidId}/cancel`)
        .set(getUserAuthHeaders())
        .send({ reason: 'Test' })
        .expect(404);

      // THEN: Not found error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/admin/appointments', () => {
    beforeEach(async () => {
      // Ensure we have appointments for admin to list
      if (!appointmentId) {
        const appointmentData = {
          ...testAppointment,
          healthUnitId,
          vaccineId,
        };
        const response = await request(app)
          .post('/api/public/appointments')
          .set(getUserAuthHeaders())
          .send(appointmentData);
        appointmentId = response.body.data._id;
      }
    });

    it('should list appointments successfully with admin auth', async () => {
      // GIVEN: Admin user
      
      // WHEN: Admin requests appointments list
      const response = await request(app)
        .get('/api/admin/appointments')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Appointments are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject listing without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User tries to list appointments
      const response = await request(app)
        .get('/api/admin/appointments')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should filter appointments by status', async () => {
      // GIVEN: Admin user with status filter
      
      // WHEN: Admin requests appointments with status filter
      const response = await request(app)
        .get('/api/admin/appointments?status=scheduled')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only scheduled appointments are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((appointment: any) => {
        expect(appointment.status).toBe('scheduled');
      });
    });

    it('should filter appointments by health unit', async () => {
      // GIVEN: Admin user with health unit filter
      
      // WHEN: Admin requests appointments for specific health unit
      const response = await request(app)
        .get(`/api/admin/appointments?healthUnitId=${healthUnitId}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only appointments for specified health unit are returned
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((appointment: any) => {
        expect(appointment.healthUnitId).toBe(healthUnitId);
      });
    });
  });

  describe('PATCH /api/admin/appointments/:id/status', () => {
    beforeEach(async () => {
      if (!appointmentId) {
        const appointmentData = {
          ...testAppointment,
          healthUnitId,
          vaccineId,
        };
        const response = await request(app)
          .post('/api/public/appointments')
          .set(getUserAuthHeaders())
          .send(appointmentData);
        appointmentId = response.body.data._id;
      }
    });

    it('should update appointment status successfully with admin auth', async () => {
      // GIVEN: Admin user with valid status update
      const statusUpdate = {
        status: 'confirmed',
        notes: 'Agendamento confirmado pelo sistema',
      };

      // WHEN: Admin updates appointment status
      const response = await request(app)
        .patch(`/api/admin/appointments/${appointmentId}/status`)
        .set(getAdminAuthHeaders())
        .send(statusUpdate)
        .expect(200);

      // THEN: Status is updated successfully
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data.status).toBe('confirmed');
    });

    it('should reject status update without admin auth', async () => {
      // GIVEN: Regular user trying to update status
      const statusUpdate = {
        status: 'confirmed',
      };

      // WHEN: User tries to update status
      const response = await request(app)
        .patch(`/api/admin/appointments/${appointmentId}/status`)
        .set(getUserAuthHeaders())
        .send(statusUpdate)
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid status values', async () => {
      // GIVEN: Admin with invalid status
      const statusUpdate = {
        status: 'invalid-status',
      };

      // WHEN: Admin tries to set invalid status
      const response = await request(app)
        .patch(`/api/admin/appointments/${appointmentId}/status`)
        .set(getAdminAuthHeaders())
        .send(statusUpdate)
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/appointments/stats', () => {
    it('should get appointment statistics with admin auth', async () => {
      // GIVEN: Admin user
      
      // WHEN: Admin requests appointment statistics
      const response = await request(app)
        .get('/api/admin/appointments/stats')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Statistics are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });
      expect(response.body.data).toMatchObject({
        totalAppointments: expect.any(Number),
        scheduledAppointments: expect.any(Number),
        confirmedAppointments: expect.any(Number),
        completedAppointments: expect.any(Number),
        cancelledAppointments: expect.any(Number),
      });
    });

    it('should reject stats request without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User tries to get stats
      const response = await request(app)
        .get('/api/admin/appointments/stats')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should filter stats by date range', async () => {
      // GIVEN: Admin user with date filters
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      // WHEN: Admin requests stats with date range
      const response = await request(app)
        .get(`/api/admin/appointments/stats?startDate=${startDate}&endDate=${endDate}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Filtered statistics are returned
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalAppointments: expect.any(Number),
        scheduledAppointments: expect.any(Number),
      });
    });
  });
});