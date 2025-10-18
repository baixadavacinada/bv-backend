import { Request, Response } from 'express';
import { MongoNotificationRepository } from '../../../infrastructure/database/implementations/MongoNotificationRepository';
import { ListNotificationsUseCase } from '../../../application/use-cases/public/ListNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '../../../application/use-cases/public/MarkNotificationAsReadUseCase';

export class NotificationController {
  private notificationRepository = new MongoNotificationRepository();
  private listNotificationsUseCase = new ListNotificationsUseCase(this.notificationRepository);
  private markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(this.notificationRepository);

  async listUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const notifications = await this.listNotificationsUseCase.execute(userId);

      res.status(200).json({
        message: 'Notificações listadas com sucesso',
        data: notifications,
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length
      });
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      if (!id) {
        res.status(400).json({ message: 'ID da notificação é obrigatório' });
        return;
      }

      const marked = await this.markNotificationAsReadUseCase.execute(id, userId);

      if (!marked) {
        res.status(404).json({ message: 'Notificação não encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Notificação marcada como lida'
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ message: 'Notificação não encontrada' });
          return;
        }
        
        if (error.message.includes('Unauthorized')) {
          res.status(403).json({ message: 'Não autorizado a modificar esta notificação' });
          return;
        }
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const count = await this.notificationRepository.markAllAsRead(userId);

      res.status(200).json({
        message: 'Todas as notificações marcadas como lidas',
        count
      });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}