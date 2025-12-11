import { Request, Response } from 'express';

export class ReportsController {
  async generateFeedbackReport(req: Request, res: Response): Promise<void> {
    try {
      const { ubsId, startDate, endDate } = req.body;

      const { FeedbackModel } = await import('../../../infrastructure/database/models/feedbackModel');
      const { HealthUnitModel } = await import('../../../infrastructure/database/models/healthUnitModel');

      const filter: any = {};
      if (ubsId) filter.healthUnitId = ubsId;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const feedbacks = await FeedbackModel.find(filter)
        .populate('healthUnitId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      // New header with numeric ratings and NPS
      const headers = [
        'Data',
        'UBS',
        'Vacina Obtida',
        'Tempo de Espera',
        'Atendimento Respeitoso',
        'Local Limpo',
        'Recomendação (NPS)',
        'Rating Geral'
      ];

      const rows = feedbacks.map(feedback => {
        return [
          new Date(feedback.createdAt).toLocaleDateString('pt-BR'),
          (feedback.healthUnitId as any)?.name || 'N/A',
          feedback.vaccineSuccessRating?.toString() || '',
          feedback.waitTimeRating?.toString() || '',
          feedback.respectfulServiceRating?.toString() || '',
          feedback.cleanLocationRating?.toString() || '',
          feedback.npsScore?.toString() || '',
          feedback.rating?.toString() || ''
        ];
      });

      const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(String).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      ];

      const csvContent = csvRows.join('\n');

      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

      const filename = `relatorio-feedbacks-${new Date().toISOString().split('T')[0]}.csv`;

      try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (folderId && serviceAccountRaw) {
          try {
            const { google } = await import('googleapis');
            const serviceAccount = JSON.parse(serviceAccountRaw);

            const auth = new google.auth.GoogleAuth({
              credentials: serviceAccount,
              scopes: ['https://www.googleapis.com/auth/drive.file'],
            });

            const authClient = await auth.getClient();
            const drive = google.drive({ version: 'v3', auth: authClient as any });

            await drive.files.create({
              requestBody: {
                name: filename,
                parents: [folderId],
                mimeType: 'text/csv',
              },
              media: {
                mimeType: 'text/csv',
                body: Buffer.from(csvContent, 'utf-8'),
              },
            });

            console.info('Relatório de feedbacks salvo no Google Drive:', filename);
          } catch (driveError) {
            console.warn('Falha ao salvar relatório no Google Drive:', driveError);
          }
        }
      } catch (driveSetupError) {
        console.warn('Erro ao tentar configurar upload para Google Drive:', driveSetupError);
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Erro ao gerar relatório de feedbacks:', error);
      res.status(500).json({
        message: 'Erro ao gerar relatório de feedbacks',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }


  async generateUserReport(req: Request, res: Response): Promise<void> {
    try {
      const { roleFilter, statusFilter } = req.body;

      const admin = await import('firebase-admin');

      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      const auth = admin.auth();
      const listUsersResult = await auth.listUsers(1000);

      let users = listUsersResult.users;

      if (roleFilter) {
        users = users.filter(user => {
          const role = user.customClaims?.role || 'public';
          return role === roleFilter;
        });
      }

      if (statusFilter && statusFilter !== 'all') {
        users = users.filter(user => {
          const isActive = user.customClaims?.isActive !== false;
          return statusFilter === 'active' ? isActive : !isActive;
        });
      }

      const headers = ['Nome', 'Email', 'Perfil', 'Status', 'Data de Criação'];
      const rows = users.map(user => [
        user.displayName || 'Sem nome',
        user.email || '',
        user.customClaims?.role || 'public',
        user.customClaims?.isActive !== false ? 'Ativo' : 'Inativo',
        new Date(user.metadata.creationTime || '').toLocaleDateString('pt-BR')
      ]);

      const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(String).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      ];

      const csvContent = csvRows.join('\n');

      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

      const filename = `relatorio-usuarios-${new Date().toISOString().split('T')[0]}.csv`;

      try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (folderId && serviceAccountRaw) {
          try {
            const { google } = await import('googleapis');
            const serviceAccount = JSON.parse(serviceAccountRaw);

            const auth = new google.auth.GoogleAuth({
              credentials: serviceAccount,
              scopes: ['https://www.googleapis.com/auth/drive.file'],
            });

            const authClient = await auth.getClient();
            const drive = google.drive({ version: 'v3', auth: authClient as any });

            await drive.files.create({
              requestBody: {
                name: filename,
                parents: [folderId],
                mimeType: 'text/csv',
              },
              media: {
                mimeType: 'text/csv',
                body: Buffer.from(csvContent, 'utf-8'),
              },
            });

            console.info('Relatório de usuários salvo no Google Drive:', filename);
          } catch (driveError) {
            console.warn('Falha ao salvar relatório no Google Drive:', driveError);
          }
        }
      } catch (driveSetupError) {
        console.warn('Erro ao tentar configurar upload para Google Drive:', driveSetupError);
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
