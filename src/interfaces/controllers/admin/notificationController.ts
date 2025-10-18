import { Request, Response } from 'express';
import { MongoNotificationRepository } from '../../../infrastructure/database/implementations/MongoNotificationRepository';
import { CreateNotificationUseCase } from '../../../application/use-cases/admin/CreateNotificationUseCase';
import { ListAllNotificationsUseCase } from '../../../application/use-cases/admin/ListAllNotificationsUseCase';

export class AdminNotificationController {
  private notificationRepository = new MongoNotificationRepository();
  private createNotificationUseCase = new CreateNotificationUseCase(this.notificationRepository);
  private listAllNotificationsUseCase = new ListAllNotificationsUseCase(this.notificationRepository);

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, message, type, data, scheduledFor } = req.body;

      if (!userId || !title || !message || !type) {
        res.status(400).json({ 
          message: 'Campos obrigatórios: userId, title, message, type' 
        });
        return;
      }

      const notification = await this.createNotificationUseCase.execute({
        userId,
        title,
        message,
        type,
        data,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
      });

      res.status(201).json({
        message: 'Notificação criada com sucesso',
        data: notification
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);

      if (error instanceof Error) {
        if (error.message.includes('Required fields')) {
          res.status(400).json({ message: error.message });
          return;
        }
        
        if (error.message.includes('must be between')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const { userId, isRead, type, startDate, endDate } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (isRead !== undefined) filters.isRead = isRead === 'true';
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const notifications = await this.listAllNotificationsUseCase.execute(filters);

      res.status(200).json({
        message: 'Notificações listadas com sucesso',
        data: notifications,
        total: notifications.length
      });
    } catch (error) {
      console.error('Erro ao listar notificações (admin):', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID da notificação é obrigatório' });
        return;
      }

      const deleted = await this.notificationRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ message: 'Notificação não encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Notificação excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID da notificação é obrigatório' });
        return;
      }

      const notification = await this.notificationRepository.findById(id);

      if (!notification) {
        res.status(404).json({ message: 'Notificação não encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Notificação encontrada',
        data: notification
      });
    } catch (error) {
      console.error('Erro ao buscar notificação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}