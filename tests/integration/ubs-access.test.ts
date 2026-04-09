import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { MongoUserRepository } from '../../src/infrastructure/database/implementations/MongoUserRepository';
import { HealthUnitModel } from '../../src/infrastructure/database/models/healthUnitModel';

describe('UBS Access Control', () => {
  let app: Express;
  let userRepository: MongoUserRepository;

  const adminGlobalUid = 'admin-global-uid';
  const adminUnitUid = 'admin-unit-uid';
  const agentUid = 'agent-uid';

  let ubs1Id: string;
  let ubs2Id: string;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = new MongoUserRepository();

    // Create test UBS
    const ubs1 = await HealthUnitModel.create({
      name: 'UBS 1',
      address: 'Address 1',
      city: 'City 1',
      state: 'RJ',
      zipCode: '12345-000'
    });
    ubs1Id = ubs1._id.toString();

    const ubs2 = await HealthUnitModel.create({
      name: 'UBS 2',
      address: 'Address 2',
      city: 'City 2',
      state: 'RJ',
      zipCode: '12345-001'
    });
    ubs2Id = ubs2._id.toString();

    // Create test users
    await userRepository.create({
      _id: adminGlobalUid,
      uid: adminGlobalUid,
      name: 'Admin Global',
      email: 'admin-global@test.com',
      role: 'admin',
      adminScope: 'global',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    await userRepository.create({
      _id: adminUnitUid,
      uid: adminUnitUid,
      name: 'Admin Unit',
      email: 'admin-unit@test.com',
      role: 'admin',
      adminScope: 'unit_scoped',
      assignedUnitsIds: [ubs1Id],
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    await userRepository.create({
      _id: agentUid,
      uid: agentUid,
      name: 'Agent',
      email: 'agent@test.com',
      role: 'agent',
      assignedUnitsIds: [ubs2Id],
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });
  });

  afterAll(async () => {
    // Clean up
    await userRepository.delete(adminGlobalUid);
    await userRepository.delete(adminUnitUid);
    await userRepository.delete(agentUid);
    await HealthUnitModel.findByIdAndDelete(ubs1Id);
    await HealthUnitModel.findByIdAndDelete(ubs2Id);
  });

  describe('Admin Global Access', () => {
    it('should allow admin global to edit any UBS', async () => {
      const response = await request(app)
        .put(`/api/admin/health-units/${ubs1Id}`)
        .set('Authorization', `Bearer mock-admin-global-token`)
        .send({
          name: 'Updated UBS 1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow admin global to delete any UBS', async () => {
      const response = await request(app)
        .delete(`/api/admin/health-units/${ubs1Id}`)
        .set('Authorization', `Bearer mock-admin-global-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Admin Unit Scoped Access', () => {
    it('should allow admin unit scoped to edit their assigned UBS', async () => {
      const response = await request(app)
        .put(`/api/admin/health-units/${ubs1Id}`)
        .set('Authorization', `Bearer mock-admin-unit-token`)
        .send({
          name: 'Updated UBS 1 by Unit Admin'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny admin unit scoped to edit unassigned UBS', async () => {
      const response = await request(app)
        .put(`/api/admin/health-units/${ubs2Id}`)
        .set('Authorization', `Bearer mock-admin-unit-token`)
        .send({
          name: 'Should Fail'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Agent Access', () => {
    it('should allow agent to edit their assigned UBS', async () => {
      const response = await request(app)
        .put(`/api/admin/health-units/${ubs2Id}`)
        .set('Authorization', `Bearer mock-agent-token`)
        .send({
          name: 'Updated UBS 2 by Agent'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny agent to edit unassigned UBS', async () => {
      const response = await request(app)
        .put(`/api/admin/health-units/${ubs1Id}`)
        .set('Authorization', `Bearer mock-agent-token`)
        .send({
          name: 'Should Fail'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});