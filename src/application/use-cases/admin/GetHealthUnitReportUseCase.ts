interface HealthUnitReportFilters {
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  city?: string;
  state?: string;
}

interface HealthUnitReport {
  summary: {
    totalHealthUnits: number;
    activeHealthUnits: number;
    inactiveHealthUnits: number;
    averageRating: number;
    totalAppointments: number;
    totalVaccinations: number;
    totalFeedbacks: number;
  };
  performance: {
    healthUnitId: string;
    healthUnitName: string;
    city: string;
    state: string;
    isActive: boolean;
    appointmentsCount: number;
    vaccinationsCount: number;
    feedbacksCount: number;
    averageRating: number;
    utilizationRate: number;
  }[];
  geographical: {
    state: string;
    healthUnitsCount: number;
    appointmentsCount: number;
    vaccinationsCount: number;
  }[];
  ratings: {
    healthUnitId: string;
    healthUnitName: string;
    averageRating: number;
    totalFeedbacks: number;
    ratingDistribution: {
      [rating: number]: number;
    };
  }[];
}

export class GetHealthUnitReportUseCase {
  constructor(
    private healthUnitsRepository: any,
    private appointmentRepository: any,
    private vaccinationRecordRepository: any,
    private feedbackRepository: any
  ) {}

  async execute(filters: HealthUnitReportFilters = {}): Promise<HealthUnitReport> {
    const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');
    const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');

    const healthUnitsQuery: any = {};
    if (filters.isActive !== undefined) healthUnitsQuery.isActive = filters.isActive;
    if (filters.city) healthUnitsQuery.city = { $regex: filters.city, $options: 'i' };
    if (filters.state) healthUnitsQuery.state = filters.state;

    const healthUnits = await HealthUnitModel.find(healthUnitsQuery);
    const healthUnitIds = healthUnits.map(hu => hu._id);

    if (healthUnits.length === 0) {
      return this.getEmptyReport();
    }

    const dateFilter: any = {};
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) dateFilter.$gte = filters.startDate;
      if (filters.endDate) dateFilter.$lte = filters.endDate;
    }

    const [appointmentStats, vaccinationStats, feedbackStats] = await Promise.all([
      this.getAppointmentStats(healthUnitIds, dateFilter),
      this.getVaccinationStats(healthUnitIds, dateFilter),
      this.getFeedbackStats(healthUnitIds, dateFilter)
    ]);

    const summary = this.calculateSummary(healthUnits, appointmentStats, vaccinationStats, feedbackStats);

    const performance = this.calculatePerformance(healthUnits, appointmentStats, vaccinationStats, feedbackStats);

    const geographical = this.calculateGeographical(healthUnits, appointmentStats, vaccinationStats);

    const ratings = await this.calculateRatings(healthUnitIds);

    return {
      summary,
      performance,
      geographical,
      ratings
    };
  }

  private getEmptyReport(): HealthUnitReport {
    return {
      summary: {
        totalHealthUnits: 0,
        activeHealthUnits: 0,
        inactiveHealthUnits: 0,
        averageRating: 0,
        totalAppointments: 0,
        totalVaccinations: 0,
        totalFeedbacks: 0
      },
      performance: [],
      geographical: [],
      ratings: []
    };
  }

  private async getAppointmentStats(healthUnitIds: any[], dateFilter: any) {
    const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');

    const matchStage: any = { healthUnitId: { $in: healthUnitIds } };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    return AppointmentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$healthUnitId',
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);
  }

  private async getVaccinationStats(healthUnitIds: any[], dateFilter: any) {
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');

    const matchStage: any = { healthUnitId: { $in: healthUnitIds } };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    return VaccinationRecordModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$healthUnitId',
          totalVaccinations: { $sum: 1 }
        }
      }
    ]);
  }

  private async getFeedbackStats(healthUnitIds: any[], dateFilter: any) {
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');

    const matchStage: any = { 
      healthUnitId: { $in: healthUnitIds },
      isActive: true
    };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    return FeedbackModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$healthUnitId',
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
  }

  private calculateSummary(healthUnits: any[], appointmentStats: any[], vaccinationStats: any[], feedbackStats: any[]) {
    const activeHealthUnits = healthUnits.filter(hu => hu.isActive).length;
    const totalAppointments = appointmentStats.reduce((sum, stat) => sum + stat.totalAppointments, 0);
    const totalVaccinations = vaccinationStats.reduce((sum, stat) => sum + stat.totalVaccinations, 0);
    const totalFeedbacks = feedbackStats.reduce((sum, stat) => sum + stat.totalFeedbacks, 0);
    
    const totalRating = feedbackStats.reduce((sum, stat) => sum + (stat.averageRating * stat.totalFeedbacks), 0);
    const averageRating = totalFeedbacks > 0 ? Math.round((totalRating / totalFeedbacks) * 10) / 10 : 0;

    return {
      totalHealthUnits: healthUnits.length,
      activeHealthUnits,
      inactiveHealthUnits: healthUnits.length - activeHealthUnits,
      averageRating,
      totalAppointments,
      totalVaccinations,
      totalFeedbacks
    };
  }

  private calculatePerformance(healthUnits: any[], appointmentStats: any[], vaccinationStats: any[], feedbackStats: any[]) {
    const appointmentMap = new Map();
    appointmentStats.forEach(stat => {
      appointmentMap.set(stat._id.toString(), stat);
    });

    const vaccinationMap = new Map();
    vaccinationStats.forEach(stat => {
      vaccinationMap.set(stat._id.toString(), stat.totalVaccinations);
    });

    const feedbackMap = new Map();
    feedbackStats.forEach(stat => {
      feedbackMap.set(stat._id.toString(), stat);
    });

    return healthUnits.map(hu => {
      const id = hu._id.toString();
      const appointmentData = appointmentMap.get(id) || { totalAppointments: 0, completedAppointments: 0 };
      const vaccinationsCount = vaccinationMap.get(id) || 0;
      const feedbackData = feedbackMap.get(id) || { totalFeedbacks: 0, averageRating: 0 };
      
      const utilizationRate = appointmentData.totalAppointments > 0 
        ? Math.round((appointmentData.completedAppointments / appointmentData.totalAppointments) * 100 * 10) / 10
        : 0;

      return {
        healthUnitId: id,
        healthUnitName: hu.name,
        city: hu.city,
        state: hu.state,
        isActive: hu.isActive,
        appointmentsCount: appointmentData.totalAppointments,
        vaccinationsCount,
        feedbacksCount: feedbackData.totalFeedbacks,
        averageRating: Math.round(feedbackData.averageRating * 10) / 10 || 0,
        utilizationRate
      };
    }).sort((a, b) => b.appointmentsCount - a.appointmentsCount);
  }

  private calculateGeographical(healthUnits: any[], appointmentStats: any[], vaccinationStats: any[]) {
    const appointmentMap = new Map();
    appointmentStats.forEach(stat => {
      appointmentMap.set(stat._id.toString(), stat.totalAppointments);
    });

    const vaccinationMap = new Map();
    vaccinationStats.forEach(stat => {
      vaccinationMap.set(stat._id.toString(), stat.totalVaccinations);
    });

    const stateMap = new Map();
    healthUnits.forEach(hu => {
      const id = hu._id.toString();
      const state = hu.state;
      
      if (!stateMap.has(state)) {
        stateMap.set(state, {
          state,
          healthUnitsCount: 0,
          appointmentsCount: 0,
          vaccinationsCount: 0
        });
      }

      const stateData = stateMap.get(state);
      stateData.healthUnitsCount++;
      stateData.appointmentsCount += appointmentMap.get(id) || 0;
      stateData.vaccinationsCount += vaccinationMap.get(id) || 0;
    });

    return Array.from(stateMap.values()).sort((a, b) => b.healthUnitsCount - a.healthUnitsCount);
  }

  private async calculateRatings(healthUnitIds: any[]) {
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');
    const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');

    const [ratingStats, healthUnits] = await Promise.all([
      FeedbackModel.aggregate([
        { 
          $match: { 
            healthUnitId: { $in: healthUnitIds },
            isActive: true
          }
        },
        {
          $group: {
            _id: {
              healthUnitId: '$healthUnitId',
              rating: '$rating'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.healthUnitId',
            averageRating: { $avg: '$_id.rating' },
            totalFeedbacks: { $sum: '$count' },
            ratingDistribution: {
              $push: {
                rating: '$_id.rating',
                count: '$count'
              }
            }
          }
        }
      ]),
      HealthUnitModel.find({ _id: { $in: healthUnitIds } }).select('name')
    ]);

    const healthUnitMap = new Map();
    healthUnits.forEach(hu => {
      healthUnitMap.set((hu._id as any).toString(), hu.name);
    });

    return ratingStats.map(stat => {
      const ratingDistribution: { [rating: number]: number } = {};
      stat.ratingDistribution.forEach((rd: any) => {
        ratingDistribution[rd.rating] = rd.count;
      });

      return {
        healthUnitId: stat._id.toString(),
        healthUnitName: healthUnitMap.get(stat._id.toString()) || 'Unknown',
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalFeedbacks: stat.totalFeedbacks,
        ratingDistribution
      };
    }).sort((a, b) => b.averageRating - a.averageRating);
  }
}