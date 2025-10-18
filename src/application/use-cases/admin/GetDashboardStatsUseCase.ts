interface DashboardStats {
  totalUsers: number;
  totalAppointments: number;
  totalVaccinationRecords: number;
  totalHealthUnits: number;
  totalVaccines: number;
  totalFeedbacks: number;
  totalNotifications: number;
  activeHealthUnits: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageFeedbackRating: number;
  unreadNotifications: number;
  recentActivity: {
    newAppointmentsToday: number;
    vaccinationsToday: number;
    newFeedbacksToday: number;
  };
  monthlyStats: {
    month: string;
    appointments: number;
    vaccinations: number;
    feedbacks: number;
  }[];
  topHealthUnits: {
    id: string;
    name: string;
    appointmentCount: number;
    averageRating: number;
  }[];
  vaccineDistribution: {
    vaccineId: string;
    vaccineName: string;
    count: number;
    percentage: number;
  }[];
}

export class GetDashboardStatsUseCase {
  constructor(
    private appointmentRepository: any,
    private vaccinationRecordRepository: any,
    private healthUnitsRepository: any,
    private vaccineRepository: any,
    private feedbackRepository: any,
    private notificationRepository: any,
    private userRepository: any
  ) {}

  async execute(): Promise<DashboardStats> {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const last6Months = new Date(today.getFullYear(), today.getMonth() - 6, 1);

    // Parallel execution for better performance
    const [
      totalUsers,
      appointments,
      vaccinationRecords,
      healthUnits,
      vaccines,
      feedbacks,
      notifications,
      todayAppointments,
      todayVaccinations,
      todayFeedbacks
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getAppointmentStats(),
      this.getVaccinationRecordStats(),
      this.getHealthUnitsStats(),
      this.getVaccineStats(),
      this.getFeedbackStats(),
      this.getNotificationStats(),
      this.getTodayAppointments(startOfToday),
      this.getTodayVaccinations(startOfToday),
      this.getTodayFeedbacks(startOfToday)
    ]);

    const monthlyStats = await this.getMonthlyStats(last6Months);
    const topHealthUnits = await this.getTopHealthUnits();
    const vaccineDistribution = await this.getVaccineDistribution();

    return {
      totalUsers,
      totalAppointments: appointments.total,
      totalVaccinationRecords: vaccinationRecords.total,
      totalHealthUnits: healthUnits.total,
      totalVaccines: vaccines.total,
      totalFeedbacks: feedbacks.total,
      totalNotifications: notifications.total,
      activeHealthUnits: healthUnits.active,
      completedAppointments: appointments.completed,
      cancelledAppointments: appointments.cancelled,
      averageFeedbackRating: feedbacks.averageRating,
      unreadNotifications: notifications.unread,
      recentActivity: {
        newAppointmentsToday: todayAppointments,
        vaccinationsToday: todayVaccinations,
        newFeedbacksToday: todayFeedbacks
      },
      monthlyStats,
      topHealthUnits,
      vaccineDistribution
    };
  }

  private async getTotalUsers(): Promise<number> {
    // This would need implementation based on user management
    // For now, return a placeholder
    return 0;
  }

  private async getAppointmentStats() {
    const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');
    
    const [total, completed, cancelled] = await Promise.all([
      AppointmentModel.countDocuments(),
      AppointmentModel.countDocuments({ status: 'completed' }),
      AppointmentModel.countDocuments({ status: 'cancelled' })
    ]);

    return { total, completed, cancelled };
  }

  private async getVaccinationRecordStats() {
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
    
    const total = await VaccinationRecordModel.countDocuments();
    return { total };
  }

  private async getHealthUnitsStats() {
    const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');
    
    const [total, active] = await Promise.all([
      HealthUnitModel.countDocuments(),
      HealthUnitModel.countDocuments({ isActive: true })
    ]);

    return { total, active };
  }

  private async getVaccineStats() {
    const { VaccineModel } = await import('../../../infrastructure/database/models/vaccineModel');
    
    const total = await VaccineModel.countDocuments({ isActive: true });
    return { total };
  }

  private async getFeedbackStats() {
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');
    
    const [total, ratings] = await Promise.all([
      FeedbackModel.countDocuments({ isActive: true }),
      FeedbackModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    const averageRating = ratings.length > 0 ? Math.round(ratings[0].avgRating * 10) / 10 : 0;
    return { total, averageRating };
  }

  private async getNotificationStats() {
    const { NotificationModel } = await import('../../../infrastructure/database/models/notificationModel');
    
    const [total, unread] = await Promise.all([
      NotificationModel.countDocuments(),
      NotificationModel.countDocuments({ isRead: false })
    ]);

    return { total, unread };
  }

  private async getTodayAppointments(startOfToday: Date): Promise<number> {
    const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');
    
    return AppointmentModel.countDocuments({
      createdAt: { $gte: startOfToday }
    });
  }

  private async getTodayVaccinations(startOfToday: Date): Promise<number> {
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
    
    return VaccinationRecordModel.countDocuments({
      date: { $gte: startOfToday }
    });
  }

  private async getTodayFeedbacks(startOfToday: Date): Promise<number> {
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');
    
    return FeedbackModel.countDocuments({
      createdAt: { $gte: startOfToday },
      isActive: true
    });
  }

  private async getMonthlyStats(last6Months: Date) {
    const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');

    const [appointmentStats, vaccinationStats, feedbackStats] = await Promise.all([
      AppointmentModel.aggregate([
        { $match: { createdAt: { $gte: last6Months } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      VaccinationRecordModel.aggregate([
        { $match: { date: { $gte: last6Months } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      FeedbackModel.aggregate([
        { $match: { createdAt: { $gte: last6Months }, isActive: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Merge results by month
    const monthlyMap = new Map();
    
    appointmentStats.forEach(stat => {
      monthlyMap.set(stat._id, { month: stat._id, appointments: stat.count, vaccinations: 0, feedbacks: 0 });
    });

    vaccinationStats.forEach(stat => {
      const existing = monthlyMap.get(stat._id) || { month: stat._id, appointments: 0, vaccinations: 0, feedbacks: 0 };
      existing.vaccinations = stat.count;
      monthlyMap.set(stat._id, existing);
    });

    feedbackStats.forEach(stat => {
      const existing = monthlyMap.get(stat._id) || { month: stat._id, appointments: 0, vaccinations: 0, feedbacks: 0 };
      existing.feedbacks = stat.count;
      monthlyMap.set(stat._id, existing);
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getTopHealthUnits() {
    const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');
    const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');

    const [appointmentCounts, feedbackRatings] = await Promise.all([
      AppointmentModel.aggregate([
        {
          $group: {
            _id: '$healthUnitId',
            appointmentCount: { $sum: 1 }
          }
        },
        { $sort: { appointmentCount: -1 } },
        { $limit: 5 }
      ]),
      FeedbackModel.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$healthUnitId',
            averageRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    // Create a map for quick rating lookup
    const ratingMap = new Map();
    feedbackRatings.forEach(rating => {
      ratingMap.set(rating._id, Math.round(rating.averageRating * 10) / 10);
    });

    // Get health unit names
    const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');
    const healthUnits = await HealthUnitModel.find({
      _id: { $in: appointmentCounts.map(ac => ac._id) }
    }).select('name');

    const healthUnitMap = new Map();
    healthUnits.forEach(hu => {
      healthUnitMap.set((hu._id as any).toString(), hu.name);
    });

    return appointmentCounts.map(ac => ({
      id: ac._id.toString(),
      name: healthUnitMap.get(ac._id.toString()) || 'Unknown',
      appointmentCount: ac.appointmentCount,
      averageRating: ratingMap.get(ac._id.toString()) || 0
    }));
  }

  private async getVaccineDistribution() {
    const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
    const { VaccineModel } = await import('../../../infrastructure/database/models/vaccineModel');

    const vaccinationCounts = await VaccinationRecordModel.aggregate([
      {
        $group: {
          _id: '$vaccineId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalVaccinations = vaccinationCounts.reduce((sum, vc) => sum + vc.count, 0);

    // Get vaccine names
    const vaccines = await VaccineModel.find({
      _id: { $in: vaccinationCounts.map(vc => vc._id) }
    }).select('name');

    const vaccineMap = new Map();
    vaccines.forEach(v => {
      vaccineMap.set((v._id as any).toString(), v.name);
    });

    return vaccinationCounts.map(vc => ({
      vaccineId: vc._id.toString(),
      vaccineName: vaccineMap.get(vc._id.toString()) || 'Unknown',
      count: vc.count,
      percentage: totalVaccinations > 0 ? Math.round((vc.count / totalVaccinations) * 100 * 10) / 10 : 0
    }));
  }
}