import { Request, Response } from 'express';
import { MongoFeedbackRepository } from '../../../infrastructure/database/implementations/MongoFeedbackRepository';
import { ListFeedbackUseCase } from '../../../application/use-cases/admin/ListFeedbackUseCase';
import { GetFeedbackByIdUseCase } from '../../../application/use-cases/admin/GetFeedbackByIdUseCase';
import { ModerateFeedbackUseCase } from '../../../application/use-cases/admin/ModerateFeedbackUseCase';

export class FeedbackController {
  private feedbackRepository = new MongoFeedbackRepository();
  private listFeedbackUseCase = new ListFeedbackUseCase(this.feedbackRepository);
  private getFeedbackByIdUseCase = new GetFeedbackByIdUseCase(this.feedbackRepository);
  private moderateFeedbackUseCase = new ModerateFeedbackUseCase(this.feedbackRepository);

  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const feedbacks = await this.listFeedbackUseCase.executeAll();

      res.status(200).json({
        message: 'Feedbacks listados com sucesso',
        data: feedbacks,
        total: feedbacks.length
      });
    } catch (error) {
      console.error('Erro ao listar feedbacks:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async listByHealthUnit(req: Request, res: Response): Promise<void> {
    try {
      const { healthUnitId } = req.query;

      if (!healthUnitId) {
        res.status(400).json({ message: 'ID da unidade de saúde é obrigatório' });
        return;
      }

      const feedbacks = await this.listFeedbackUseCase.executeByHealthUnit(healthUnitId as string);

      res.status(200).json({
        message: 'Feedbacks da unidade listados com sucesso',
        data: feedbacks,
        total: feedbacks.length
      });
    } catch (error) {
      console.error('Erro ao listar feedbacks da unidade:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID é obrigatório' });
        return;
      }

      const feedback = await this.getFeedbackByIdUseCase.execute(id);

      if (!feedback) {
        res.status(404).json({ message: 'Feedback não encontrado' });
        return;
      }

      res.status(200).json({
        message: 'Feedback encontrado',
        data: feedback
      });
    } catch (error) {
      console.error('Erro ao buscar feedback:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async moderate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const moderatedBy = req.user?.id;

      if (!id) {
        res.status(400).json({ message: 'ID é obrigatório' });
        return;
      }

      if (!moderatedBy) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ message: 'Campo isActive deve ser boolean' });
        return;
      }

      const moderated = await this.moderateFeedbackUseCase.execute(id, {
        moderatedBy,
        isActive
      });

      if (!moderated) {
        res.status(404).json({ message: 'Feedback não encontrado' });
        return;
      }

      res.status(200).json({
        message: 'Feedback moderado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao moderar feedback:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ message: 'Feedback não encontrado' });
        return;
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}