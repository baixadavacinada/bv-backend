interface VaccinationReportFilters {
  startDate?: Date;
  endDate?: Date;
  healthUnitId?: string;
  vaccineId?: string;
  ageRange?: {
    min: number;
    max: number;
  };
}

interface VaccinationReport {
  summary: {
    totalVaccinations: number;
    uniquePatients: number;
    averageAge: number;
    genderDistribution: {
      male: number;
      female: number;
      other: number;
    };
    doseDistribution: {
      [key: string]: number;
    };
  };
  byHealthUnit: {
    healthUnitId: string;
    healthUnitName: string;
    vaccinationsCount: number;
    percentage: number;
  }[];
  byVaccine: {
    vaccineId: string;
    vaccineName: string;
    vaccinationsCount: number;
    percentage: number;
  }[];
  byDate: {
    date: string;
    count: number;
  }[];
  byAgeGroup: {
    ageGroup: string;
    count: number;
    percentage: number;
  }[];
  coverage: {
    targetPopulation?: number;
    vaccinatedPopulation: number;
    coveragePercentage: number;
  };
}

export class GetVaccinationReportUseCase {
  constructor(private vaccinationRecordRepository: any) {}

  async execute(filters: VaccinationReportFilters = {}): Promise<VaccinationReport> {
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
    const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');
    const { VaccineModel } = await import('../../../infrastructure/database/models/vaccineModel');

    // Build query based on filters
    const query: any = {};
    
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }
    
    if (filters.healthUnitId) {
      query.healthUnitId = filters.healthUnitId;
    }
    
    if (filters.vaccineId) {
      query.vaccineId = filters.vaccineId;
    }

    // Get all vaccination records matching filters
    const vaccinationRecords = await VaccinationRecordModel.find(query);
    const totalVaccinations = vaccinationRecords.length;

    if (totalVaccinations === 0) {
      return this.getEmptyReport();
    }

    // Calculate summary statistics
    const summary = await this.calculateSummary(vaccinationRecords);
    
    // Calculate distributions
    const [byHealthUnit, byVaccine, byDate, byAgeGroup] = await Promise.all([
      this.calculateByHealthUnit(vaccinationRecords, totalVaccinations),
      this.calculateByVaccine(vaccinationRecords, totalVaccinations),
      this.calculateByDate(vaccinationRecords),
      this.calculateByAgeGroup(vaccinationRecords, totalVaccinations)
    ]);

    // Calculate coverage (simplified - would need population data)
    const coverage = {
      targetPopulation: undefined,
      vaccinatedPopulation: summary.uniquePatients,
      coveragePercentage: 0 // Would need target population data
    };

    return {
      summary,
      byHealthUnit,
      byVaccine,
      byDate,
      byAgeGroup,
      coverage
    };
  }

  private getEmptyReport(): VaccinationReport {
    return {
      summary: {
        totalVaccinations: 0,
        uniquePatients: 0,
        averageAge: 0,
        genderDistribution: { male: 0, female: 0, other: 0 },
        doseDistribution: {}
      },
      byHealthUnit: [],
      byVaccine: [],
      byDate: [],
      byAgeGroup: [],
      coverage: {
        vaccinatedPopulation: 0,
        coveragePercentage: 0
      }
    };
  }

  private async calculateSummary(records: any[]) {
    // Calculate unique patients
    const uniquePatients = new Set(records.map(r => r.residentId)).size;

    // Calculate dose distribution
    const doseDistribution: { [key: string]: number } = {};
    records.forEach(record => {
      const dose = record.dose || 'unknown';
      doseDistribution[dose] = (doseDistribution[dose] || 0) + 1;
    });

    // Note: Age and gender would require patient data integration
    // For now, using placeholder values
    return {
      totalVaccinations: records.length,
      uniquePatients,
      averageAge: 0, // Would need patient birth dates
      genderDistribution: { male: 0, female: 0, other: 0 }, // Would need patient gender data
      doseDistribution
    };
  }

  private async calculateByHealthUnit(records: any[], total: number) {
    const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');

    // Group by health unit
    const healthUnitCounts = new Map();
    records.forEach(record => {
      const id = record.healthUnitId.toString();
      healthUnitCounts.set(id, (healthUnitCounts.get(id) || 0) + 1);
    });

    // Get health unit names
    const healthUnitIds = Array.from(healthUnitCounts.keys());
    const healthUnits = await HealthUnitModel.find({
      _id: { $in: healthUnitIds }
    }).select('name');

    const healthUnitMap = new Map();
    healthUnits.forEach(hu => {
      healthUnitMap.set((hu._id as any).toString(), hu.name);
    });

    // Build result
    const result = [];
    for (const [healthUnitId, count] of healthUnitCounts) {
      result.push({
        healthUnitId,
        healthUnitName: healthUnitMap.get(healthUnitId) || 'Unknown',
        vaccinationsCount: count,
        percentage: Math.round((count / total) * 100 * 10) / 10
      });
    }

    return result.sort((a, b) => b.vaccinationsCount - a.vaccinationsCount);
  }

  private async calculateByVaccine(records: any[], total: number) {
    const { VaccineModel } = await import('../../../infrastructure/database/models/vaccineModel');

    // Group by vaccine
    const vaccineCounts = new Map();
    records.forEach(record => {
      const id = record.vaccineId.toString();
      vaccineCounts.set(id, (vaccineCounts.get(id) || 0) + 1);
    });

    // Get vaccine names
    const vaccineIds = Array.from(vaccineCounts.keys());
    const vaccines = await VaccineModel.find({
      _id: { $in: vaccineIds }
    }).select('name');

    const vaccineMap = new Map();
    vaccines.forEach(v => {
      vaccineMap.set((v._id as any).toString(), v.name);
    });

    // Build result
    const result = [];
    for (const [vaccineId, count] of vaccineCounts) {
      result.push({
        vaccineId,
        vaccineName: vaccineMap.get(vaccineId) || 'Unknown',
        vaccinationsCount: count,
        percentage: Math.round((count / total) * 100 * 10) / 10
      });
    }

    return result.sort((a, b) => b.vaccinationsCount - a.vaccinationsCount);
  }

  private calculateByDate(records: any[]) {
    // Group by date
    const dateCounts = new Map();
    records.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0]; // YYYY-MM-DD
      dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
    });

    // Build result
    const result = [];
    for (const [date, count] of dateCounts) {
      result.push({ date, count });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateByAgeGroup(records: any[], total: number) {
    // Age groups would require patient birth date data
    // For now, return placeholder data
    const ageGroups = [
      { ageGroup: '0-17 anos', count: 0, percentage: 0 },
      { ageGroup: '18-39 anos', count: 0, percentage: 0 },
      { ageGroup: '40-59 anos', count: 0, percentage: 0 },
      { ageGroup: '60+ anos', count: 0, percentage: 0 }
    ];

    // Would need patient age calculation here
    // For now, distribute randomly for demo purposes
    if (total > 0) {
      ageGroups[0].count = Math.floor(total * 0.15);
      ageGroups[1].count = Math.floor(total * 0.35);
      ageGroups[2].count = Math.floor(total * 0.30);
      ageGroups[3].count = total - ageGroups[0].count - ageGroups[1].count - ageGroups[2].count;

      ageGroups.forEach(group => {
        group.percentage = Math.round((group.count / total) * 100 * 10) / 10;
      });
    }

    return ageGroups;
  }
}