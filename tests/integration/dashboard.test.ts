import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { getAdminAuthHeaders, getUserAuthHeaders } from '../helpers/authHelpers';
import { testHealthUnit, testVaccine, testAppointment, testFeedback, testNotification } from '../fixtures/testData';

describe('Dashboard & Reports API Integration Tests', () => {
  let app: Express;
  let healthUnitId: string;
  let vaccineId: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Setup test data for comprehensive dashboard testing
    
    // Create health unit
    const healthUnitResponse = await request(app)
      .post('/api/admin/health-units')
      .set(getAdminAuthHeaders())
      .send(testHealthUnit);
    healthUnitId = healthUnitResponse.body.data._id;

    // Create vaccine (if endpoint exists)
    try {
      const vaccineResponse = await request(app)
        .post('/api/admin/vaccines')
        .set(getAdminAuthHeaders())
        .send(testVaccine);
      vaccineId = vaccineResponse.body.data?._id || 'mock-vaccine-id';
    } catch (error) {
      vaccineId = 'mock-vaccine-id';
    }

    // Create some test appointments
    const appointmentData = {
      ...testAppointment,
      healthUnitId,
      vaccineId,
    };
    
    await request(app)
      .post('/api/public/appointments')
      .set(getUserAuthHeaders())
      .send(appointmentData);

    // Create test feedback
    const feedbackData = {
      ...testFeedback,
      healthUnitId,
    };
    
    await request(app)
      .post('/api/public/feedback')
      .set(getUserAuthHeaders())
      .send(feedbackData);

    // Create test notification
    const notificationData = {
      ...testNotification,
      userId: 'test-user-uid',
    };
    
    await request(app)
      .post('/api/admin/notifications')
      .set(getAdminAuthHeaders())
      .send(notificationData);
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('should get comprehensive dashboard statistics with admin auth', async () => {
      // GIVEN: Admin user requesting dashboard stats
      
      // WHEN: Admin requests dashboard statistics
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Comprehensive dashboard statistics are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });

      const data = response.body.data;
      expect(data).toMatchObject({
        // Core metrics
        totalUsers: expect.any(Number),
        totalAppointments: expect.any(Number),
        totalVaccinationRecords: expect.any(Number),
        totalHealthUnits: expect.any(Number),
        totalVaccines: expect.any(Number),
        totalFeedbacks: expect.any(Number),
        totalNotifications: expect.any(Number),
        
        // Status-specific metrics
        activeHealthUnits: expect.any(Number),
        completedAppointments: expect.any(Number),
        cancelledAppointments: expect.any(Number),
        averageFeedbackRating: expect.any(Number),
        unreadNotifications: expect.any(Number),
        
        // Recent activity
        recentActivity: {
          newAppointmentsToday: expect.any(Number),
          vaccinationsToday: expect.any(Number),
          newFeedbacksToday: expect.any(Number),
        },
        
        // Analytical data
        monthlyStats: expect.arrayContaining([
          expect.objectContaining({
            month: expect.any(String),
            appointments: expect.any(Number),
            vaccinations: expect.any(Number),
            feedbacks: expect.any(Number),
          }),
        ]),
        
        topHealthUnits: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            appointmentCount: expect.any(Number),
            averageRating: expect.any(Number),
          }),
        ]),
        
        vaccineDistribution: expect.arrayContaining([
          expect.objectContaining({
            vaccineId: expect.any(String),
            vaccineName: expect.any(String),
            count: expect.any(Number),
            percentage: expect.any(Number),
          }),
        ]),
      });

      // Verify logical consistency
      expect(data.totalHealthUnits).toBeGreaterThanOrEqual(data.activeHealthUnits);
      expect(data.averageFeedbackRating).toBeGreaterThanOrEqual(0);
      expect(data.averageFeedbackRating).toBeLessThanOrEqual(5);
    });

    it('should reject dashboard stats request without admin auth', async () => {
      // GIVEN: Regular user trying to access dashboard
      
      // WHEN: User requests dashboard stats
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error is returned
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject dashboard stats request without authentication', async () => {
      // GIVEN: No authentication
      
      // WHEN: Request without auth headers
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .expect(401);

      // THEN: Unauthorized error is returned
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/admin/dashboard/quick-stats', () => {
    it('should get quick dashboard statistics with admin auth', async () => {
      // GIVEN: Admin user requesting quick stats
      
      // WHEN: Admin requests quick statistics
      const response = await request(app)
        .get('/api/admin/dashboard/quick-stats')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Quick statistics are returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });

      const data = response.body.data;
      expect(data).toMatchObject({
        totalAppointments: expect.any(Number),
        totalVaccinations: expect.any(Number),
        activeHealthUnits: expect.any(Number),
        todayAppointments: expect.any(Number),
        averageRating: expect.any(Number),
      });

      // Quick stats should have fewer fields than full stats
      expect(Object.keys(data).length).toBeLessThan(15);
    });

    it('should reject quick stats request without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User requests quick stats
      const response = await request(app)
        .get('/api/admin/dashboard/quick-stats')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/admin/reports/vaccination', () => {
    it('should get vaccination report with admin auth', async () => {
      // GIVEN: Admin user requesting vaccination report
      
      // WHEN: Admin requests vaccination report
      const response = await request(app)
        .get('/api/admin/reports/vaccination')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Vaccination report is returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });

      const data = response.body.data;
      expect(data).toMatchObject({
        summary: {
          totalVaccinations: expect.any(Number),
          uniquePatients: expect.any(Number),
          averageAge: expect.any(Number),
          genderDistribution: expect.any(Object),
          doseDistribution: expect.any(Object),
        },
        byHealthUnit: expect.any(Array),
        byVaccine: expect.any(Array),
        byDate: expect.any(Array),
        byAgeGroup: expect.any(Array),
        coverage: expect.any(Object),
      });
    });

    it('should filter vaccination report by date range', async () => {
      // GIVEN: Admin user with date filters
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      // WHEN: Admin requests filtered vaccination report
      const response = await request(app)
        .get(`/api/admin/reports/vaccination?startDate=${startDate}&endDate=${endDate}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Filtered report is returned
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        summary: expect.any(Object),
        byHealthUnit: expect.any(Array),
        byVaccine: expect.any(Array),
      });
    });

    it('should filter vaccination report by health unit', async () => {
      // GIVEN: Admin user filtering by health unit
      
      // WHEN: Admin requests report for specific health unit
      const response = await request(app)
        .get(`/api/admin/reports/vaccination?healthUnitId=${healthUnitId}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Health unit specific report is returned
      expect(response.body.success).toBe(true);
      expect(response.body.data.byHealthUnit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            healthUnitId: healthUnitId,
          }),
        ])
      );
    });

    it('should filter vaccination report by vaccine type', async () => {
      // GIVEN: Admin user filtering by vaccine
      
      // WHEN: Admin requests report for specific vaccine
      const response = await request(app)
        .get(`/api/admin/reports/vaccination?vaccineId=${vaccineId}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Vaccine specific report is returned
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        summary: expect.any(Object),
        byVaccine: expect.any(Array),
      });
    });

    it('should reject vaccination report without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User requests vaccination report
      const response = await request(app)
        .get('/api/admin/reports/vaccination')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject vaccination report with invalid date format', async () => {
      // GIVEN: Admin with invalid date format
      
      // WHEN: Admin requests report with invalid date
      const response = await request(app)
        .get('/api/admin/reports/vaccination?startDate=invalid-date')
        .set(getAdminAuthHeaders())
        .expect(400);

      // THEN: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/reports/health-units', () => {
    it('should get health units report with admin auth', async () => {
      // GIVEN: Admin user requesting health units report
      
      // WHEN: Admin requests health units report
      const response = await request(app)
        .get('/api/admin/reports/health-units')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Health units report is returned
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('sucesso'),
      });

      const data = response.body.data;
      expect(data).toMatchObject({
        summary: expect.any(Object),
        performance: expect.any(Array),
        geographical: expect.any(Array),
        ratings: expect.any(Array),
      });
    });

    it('should filter health units report by active status', async () => {
      // GIVEN: Admin filtering by active status
      
      // WHEN: Admin requests report for active units only
      const response = await request(app)
        .get('/api/admin/reports/health-units?isActive=true')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Only active health units are included
      expect(response.body.success).toBe(true);
      expect(response.body.data.performance).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isActive: true,
          }),
        ])
      );
    });

    it('should filter health units report by city', async () => {
      // GIVEN: Admin filtering by city
      
      // WHEN: Admin requests report for specific city
      const response = await request(app)
        .get('/api/admin/reports/health-units?city=Japeri')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: City-specific report is returned
      expect(response.body.success).toBe(true);
      expect(response.body.data.geographical).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            city: 'Japeri',
          }),
        ])
      );
    });

    it('should filter health units report by state', async () => {
      // GIVEN: Admin filtering by state
      
      // WHEN: Admin requests report for specific state
      const response = await request(app)
        .get('/api/admin/reports/health-units?state=RJ')
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: State-specific report is returned
      expect(response.body.success).toBe(true);
      expect(response.body.data.geographical).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            state: 'RJ',
          }),
        ])
      );
    });

    it('should reject health units report without admin auth', async () => {
      // GIVEN: Regular user
      
      // WHEN: User requests health units report
      const response = await request(app)
        .get('/api/admin/reports/health-units')
        .set(getUserAuthHeaders())
        .expect(403);

      // THEN: Forbidden error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should filter health units report by date range', async () => {
      // GIVEN: Admin with date range filter
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      // WHEN: Admin requests filtered report
      const response = await request(app)
        .get(`/api/admin/reports/health-units?startDate=${startDate}&endDate=${endDate}`)
        .set(getAdminAuthHeaders())
        .expect(200);

      // THEN: Date-filtered report is returned
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        summary: expect.any(Object),
        performance: expect.any(Array),
      });
    });
  });

  describe('Dashboard Performance Tests', () => {
    it('should respond to dashboard stats within acceptable time', async () => {
      // GIVEN: Admin user and performance requirement
      const startTime = Date.now();
      
      // WHEN: Admin requests dashboard stats
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set(getAdminAuthHeaders())
        .expect(200);

      const responseTime = Date.now() - startTime;

      // THEN: Response time should be under 3 seconds for dashboard
      expect(responseTime).toBeLessThan(3000);
      expect(response.body.success).toBe(true);
    });

    it('should respond to quick stats faster than full stats', async () => {
      // GIVEN: Admin user
      
      // WHEN: Requesting both quick and full stats
      const quickStartTime = Date.now();
      await request(app)
        .get('/api/admin/dashboard/quick-stats')
        .set(getAdminAuthHeaders())
        .expect(200);
      const quickResponseTime = Date.now() - quickStartTime;

      const fullStartTime = Date.now();
      await request(app)
        .get('/api/admin/dashboard/stats')
        .set(getAdminAuthHeaders())
        .expect(200);
      const fullResponseTime = Date.now() - fullStartTime;

      // THEN: Quick stats should be faster than full stats
      expect(quickResponseTime).toBeLessThan(fullResponseTime);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should return consistent data across different endpoints', async () => {
      // GIVEN: Admin user requesting multiple related endpoints
      
      // WHEN: Getting data from dashboard and reports
      const [dashboardResponse, vaccinationReportResponse, healthUnitsReportResponse] = await Promise.all([
        request(app).get('/api/admin/dashboard/stats').set(getAdminAuthHeaders()),
        request(app).get('/api/admin/reports/vaccination').set(getAdminAuthHeaders()),
        request(app).get('/api/admin/reports/health-units').set(getAdminAuthHeaders()),
      ]);

      // THEN: Data should be consistent across endpoints
      expect(dashboardResponse.status).toBe(200);
      expect(vaccinationReportResponse.status).toBe(200);
      expect(healthUnitsReportResponse.status).toBe(200);

      const dashboardData = dashboardResponse.body.data;
      const vaccinationData = vaccinationReportResponse.body.data;
      const healthUnitsData = healthUnitsReportResponse.body.data;

      // Health units count should be consistent
      expect(dashboardData.totalHealthUnits).toBeGreaterThanOrEqual(0);
      expect(healthUnitsData.summary.totalHealthUnits).toBe(dashboardData.totalHealthUnits);

      // Vaccination records should be consistent
      expect(dashboardData.totalVaccinationRecords).toBeGreaterThanOrEqual(0);
      expect(vaccinationData.summary.totalVaccinations).toBe(dashboardData.totalVaccinationRecords);
    });
  });
});