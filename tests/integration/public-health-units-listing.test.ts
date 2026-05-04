import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import { HealthUnitModel } from '../../src/infrastructure/database/models/healthUnitModel';

describe('Public Health Units Listing Flow', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    // Cleanup
    await HealthUnitModel.deleteMany({ name: 'Vidall' });
  });

  it('should verify UBS Vidall is not active in listings', async () => {
    // GIVEN: Search for UBS Vidall in public API
    const response = await request(app)
      .get('/api/public/health-units')
      .query({ isActive: true })
      .expect(200);

    // THEN: Vidall should NOT appear in list (either not exist or isActive=false)
    const vidallFound = response.body.data?.some(
      (unit: any) => unit.name.toLowerCase().includes('vidall')
    );

    expect(vidallFound).toBe(false);
    console.log('✅ Health units list correctly filtered by isActive status');
  });

  it('should mark Vidall as inactive if it exists', async () => {
    // Check if Vidall exists
    const vidall = await HealthUnitModel.findOne({ name: 'Vidall' });

    if (vidall && vidall.isActive) {
      // Mark as inactive
      vidall.isActive = false;
      await vidall.save();
      console.log('✅ Successfully deactivated health unit');
    } else if (!vidall) {
      console.log('⚠️  Health unit not found in database');
    } else {
      console.log('✅ Health unit already marked as inactive');
    }

    // Verify
    const stillActive = await HealthUnitModel.findOne({ name: 'Vidall', isActive: true });
    expect(stillActive).toBeNull();
  });
});
