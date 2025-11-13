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
        comment,
        isAnonymous 
      } = req.body;
      const userId = (req.user as any)?.uid || (req.user as any)?.id;

      if (!healthUnitId || rating === undefined) {
        res.status(400).json({ 
          message: 'Campos obrigatórios: healthUnitId, rating' 
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
        rating: Number(rating),
        comment: comment || ''
      } as any);

      res.status(201).json({
        message: 'Feedback criado com sucesso',
        data: feedback
      });
    } catch (error) {
      console.error('Erro ao criar feedback:', error);

      if (error instanceof Error) {
        if (error.message.includes('Rating must be between')) {
          res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
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

      const averageRating = feedbacks.length > 0 
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
        : 0;

      res.status(200).json({
        message: 'Feedbacks da unidade listados com sucesso',
        data: feedbacks,
        total: feedbacks.length,
        averageRating: Math.round(averageRating * 10) / 10
      });
    } catch (error) {
      console.error('Erro ao listar feedbacks da unidade:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}