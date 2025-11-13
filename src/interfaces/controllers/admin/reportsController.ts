import { Request, Response } from 'express';

/**
 * Controller para gerar relatórios em Excel
 */
export class ReportsController {
  /**
   * Gera relatório de feedbacks em Excel
   */
  async generateFeedbackReport(req: Request, res: Response): Promise<void> {
    try {
      const { ubsId, startDate, endDate } = req.body;

      // Importar modelos dinamicamente
      const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');
      const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');

      // Construir filtro
      const filter: any = {};
      if (ubsId) filter.healthUnitId = ubsId;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Buscar feedbacks com população
      const feedbacks = await FeedbackModel.find(filter)
        .populate('healthUnitId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      // Gerar CSV
      const headers = ['Data', 'UBS', 'Avaliação', 'Rating'];
      const rows = feedbacks.map(feedback => [
        new Date(feedback.createdAt).toLocaleDateString('pt-BR'),
        (feedback.healthUnitId as any)?.name || 'N/A',
        feedback.vaccineSuccess?.substring(0, 100) || '',
        feedback.rating?.toString() || ''
      ]);

      // Criar conteúdo TSV (Tab-Separated Values)
      const csvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      // Adicionar BOM para UTF-8
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

      // Enviar como Excel (que aceita TSV)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-feedbacks-${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Erro ao gerar relatório de feedbacks:', error);
      res.status(500).json({
        message: 'Erro ao gerar relatório de feedbacks',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Gera relatório de usuários em Excel
   */
  async generateUserReport(req: Request, res: Response): Promise<void> {
    try {
      const { roleFilter, statusFilter } = req.body;

      // Importar módulo Firebase Admin
      const admin = await import('firebase-admin');

      // Se ainda não inicializado, inicializar
      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      // Buscar usuários do Firebase com filtros customizados
      const auth = admin.auth();
      const listUsersResult = await auth.listUsers(1000);

      let users = listUsersResult.users;

      // Filtrar por role se especificado
      if (roleFilter) {
        users = users.filter(user => {
          const role = user.customClaims?.role || 'public';
          return role === roleFilter;
        });
      }

      // Filtrar por status se especificado
      if (statusFilter && statusFilter !== 'all') {
        users = users.filter(user => {
          const isActive = user.customClaims?.isActive !== false;
          return statusFilter === 'active' ? isActive : !isActive;
        });
      }

      // Gerar CSV
      const headers = ['Nome', 'Email', 'Perfil', 'Status', 'Data de Criação'];
      const rows = users.map(user => [
        user.displayName || 'Sem nome',
        user.email || '',
        user.customClaims?.role || 'public',
        user.customClaims?.isActive !== false ? 'Ativo' : 'Inativo',
        new Date(user.metadata.creationTime || '').toLocaleDateString('pt-BR')
      ]);

      // Criar conteúdo TSV
      const csvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      // Adicionar BOM para UTF-8
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

      // Enviar como Excel
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-usuarios-${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Erro ao gerar relatório de usuários:', error);
      res.status(500).json({
        message: 'Erro ao gerar relatório de usuários',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}
