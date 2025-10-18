import { Request, Response } from 'express';
import { GetDashboardStatsUseCase } from '../../../application/use-cases/admin/GetDashboardStatsUseCase';
import { GetVaccinationReportUseCase } from '../../../application/use-cases/admin/GetVaccinationReportUseCase';
import { GetHealthUnitReportUseCase } from '../../../application/use-cases/admin/GetHealthUnitReportUseCase';

export class DashboardController {
  private getDashboardStatsUseCase: GetDashboardStatsUseCase;
  private getVaccinationReportUseCase: GetVaccinationReportUseCase;
  private getHealthUnitReportUseCase: GetHealthUnitReportUseCase;

  constructor() {
    // Initialize use cases with null repositories for now
    // They will use direct model imports internally
    this.getDashboardStatsUseCase = new GetDashboardStatsUseCase(
      null, null, null, null, null, null, null
    );
    this.getVaccinationReportUseCase = new GetVaccinationReportUseCase(null);
    this.getHealthUnitReportUseCase = new GetHealthUnitReportUseCase(
      null, null, null, null
    );
  }

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getDashboardStatsUseCase.execute();

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Estatísticas do dashboard recuperadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas do dashboard:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_STATS_ERROR',
          message: 'Erro ao obter estatísticas do dashboard'
        }
      });
    }
  }

  async getVaccinationReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, healthUnitId, vaccineId } = req.query;

      const filters: any = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_START_DATE',
              message: 'Data inicial inválida'
            }
          });
          return;
        }
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_END_DATE',
              message: 'Data final inválida'
            }
          });
          return;
        }
      }

      if (healthUnitId) filters.healthUnitId = healthUnitId as string;
      if (vaccineId) filters.vaccineId = vaccineId as string;

      const report = await this.getVaccinationReportUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Relatório de vacinação gerado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de vacinação:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VACCINATION_REPORT_ERROR',
          message: 'Erro ao gerar relatório de vacinação'
        }
      });
    }
  }

  async getHealthUnitReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, isActive, city, state } = req.query;

      const filters: any = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
        if (isNaN(filters.startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_START_DATE',
              message: 'Data inicial inválida'
            }
          });
          return;
        }
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
        if (isNaN(filters.endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_END_DATE',
              message: 'Data final inválida'
            }
          });
          return;
        }
      }

      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (city) filters.city = city as string;
      if (state) filters.state = state as string;

      const report = await this.getHealthUnitReportUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Relatório de unidades de saúde gerado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de unidades de saúde:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_UNIT_REPORT_ERROR',
          message: 'Erro ao gerar relatório de unidades de saúde'
        }
      });
    }
  }

  async getQuickStats(req: Request, res: Response): Promise<void> {
    try {
      // Quick stats for mobile/lightweight requests
      const { AppointmentModel } = await import('../../../infrastructure/database/models/appointmentModel');
      const { VaccinationRecordModel } = await import('../../../infrastructure/database/models/vaccinationRecordModel');
      const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');
      const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const [
        totalAppointments,
        totalVaccinations,
        activeHealthUnits,
        todayAppointments,
        averageRating
      ] = await Promise.all([
        AppointmentModel.countDocuments(),
        VaccinationRecordModel.countDocuments(),
        HealthUnitModel.countDocuments({ isActive: true }),
        AppointmentModel.countDocuments({ createdAt: { $gte: startOfToday } }),
        FeedbackModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ])
      ]);

      const avgRating = averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0;

      res.status(200).json({
        success: true,
        data: {
          totalAppointments,
          totalVaccinations,
          activeHealthUnits,
          todayAppointments,
          averageRating: avgRating
        },
        message: 'Estatísticas rápidas recuperadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas rápidas:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QUICK_STATS_ERROR',
          message: 'Erro ao obter estatísticas rápidas'
        }
      });
    }
  }
}