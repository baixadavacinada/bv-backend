import { Request, Response } from 'express';
import { MongoFeedbackRepository } from '../../../infrastructure/database/implementations/MongoFeedbackRepository';
import { CreateFeedbackUseCase } from '../../../application/use-cases/public/CreateFeedbackUseCase';
import { ListFeedbackUseCase } from '../../../application/use-cases/admin/ListFeedbackUseCase';

export class PublicFeedbackController {
  private feedbackRepository = new MongoFeedbackRepository();
  private createFeedbackUseCase = new CreateFeedbackUseCase(this.feedbackRepository);
  private listFeedbackUseCase = new ListFeedbackUseCase(this.feedbackRepository);

  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        healthUnitId,
        rating,
        vaccineSuccessRating,
        waitTimeRating,
        respectfulServiceRating,
        cleanLocationRating,
        npsScore,
        comment,
        vaccineSuccess,
        waitTime,
        respectfulService,
        cleanLocation,
        recommendation,
        isAnonymous
      } = req.body;
      const userId = (req.user as any)?.uid || (req.user as any)?.id;

      if (!healthUnitId) {
        res.status(400).json({
          message: 'Campos obrigatórios: healthUnitId'
        });
        return;
      }

      if (!isAnonymous && !userId) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const feedback = await this.createFeedbackUseCase.execute({
        healthUnitId,
        userId: isAnonymous ? undefined : userId,
        rating: rating !== undefined ? Number(rating) : undefined,
        vaccineSuccessRating: vaccineSuccessRating !== undefined ? Number(vaccineSuccessRating) : undefined,
        waitTimeRating: waitTimeRating !== undefined ? Number(waitTimeRating) : undefined,
        respectfulServiceRating: respectfulServiceRating !== undefined ? Number(respectfulServiceRating) : undefined,
        cleanLocationRating: cleanLocationRating !== undefined ? Number(cleanLocationRating) : undefined,
        npsScore: npsScore !== undefined ? Number(npsScore) : undefined,
        vaccineSuccess: vaccineSuccess || undefined,
        waitTime: waitTime || undefined,
        respectfulService: respectfulService || undefined,
        cleanLocation: cleanLocation || undefined,
        recommendation: recommendation || undefined,
        comment: comment || undefined,
        isAnonymous: isAnonymous || true
      } as any);

      res.status(201).json({
        message: 'Feedback criado com sucesso',
        data: feedback
      });
    } catch (error) {
      console.error('Erro ao criar feedback:', error);

      if (error instanceof Error) {
        if (error.message.includes('must be between')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async listByHealthUnit(req: Request, res: Response): Promise<void> {
    try {
      const { healthUnitId } = req.params;

      if (!healthUnitId) {
        res.status(400).json({ message: 'ID da unidade de saúde é obrigatório' });
        return;
      }

      const feedbacks = await this.listFeedbackUseCase.executeByHealthUnit(healthUnitId);

      // Calculate averages for old rating system
      const averageRating = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length
        : 0;

      // Calculate averages for new rating system
      const avgVaccineSuccess = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.vaccineSuccessRating || 0), 0) / feedbacks.length
        : 0;

      const avgWaitTime = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.waitTimeRating || 0), 0) / feedbacks.length
        : 0;

      const avgRespectfulService = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.respectfulServiceRating || 0), 0) / feedbacks.length
        : 0;

      const avgCleanLocation = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + (f.cleanLocationRating || 0), 0) / feedbacks.length
        : 0;

      // Calculate NPS Score
      const feedbacksWithNps = feedbacks.filter(f => f.npsScore !== undefined);
      const avgNps = feedbacksWithNps.length > 0
        ? feedbacksWithNps.reduce((sum, f) => sum + (f.npsScore || 0), 0) / feedbacksWithNps.length
        : 0;

      const promoters = feedbacksWithNps.filter(f => (f.npsScore || 0) >= 9).length;
      const passives = feedbacksWithNps.filter(f => (f.npsScore || 0) >= 7 && (f.npsScore || 0) < 9).length;
      const detractors = feedbacksWithNps.filter(f => (f.npsScore || 0) < 7).length;

      const npsScore = feedbacksWithNps.length > 0
        ? ((promoters - detractors) / feedbacksWithNps.length) * 100
        : 0;

      res.status(200).json({
        message: 'Feedbacks da unidade listados com sucesso',
        data: feedbacks,
        total: feedbacks.length,
        averageRating: Math.round(averageRating * 10) / 10,
        averageRatings: {
          vaccineSuccess: Math.round(avgVaccineSuccess * 10) / 10,
          waitTime: Math.round(avgWaitTime * 10) / 10,
          respectfulService: Math.round(avgRespectfulService * 10) / 10,
          cleanLocation: Math.round(avgCleanLocation * 10) / 10
        },
        npsMetrics: {
          score: Math.round(npsScore),
          promoters,
          passives,
          detractors,
          averageNps: Math.round(avgNps * 10) / 10
        }
      });
    } catch (error) {
      console.error('Erro ao listar feedbacks da unidade:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}