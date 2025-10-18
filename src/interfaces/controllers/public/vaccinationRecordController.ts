import { Request, Response } from 'express';
import { MongoVaccinationRecordRepository } from '../../../infrastructure/database/implementations/MongoVaccinationRecordRepository';
import { GetVaccinationRecordsByUserUseCase } from '../../../application/use-cases/public/GetVaccinationRecordsByUserUseCase';

export class PublicVaccinationRecordController {
  private vaccinationRecordRepository = new MongoVaccinationRecordRepository();
  private getVaccinationRecordsByUserUseCase = new GetVaccinationRecordsByUserUseCase(this.vaccinationRecordRepository);

  async getMyVaccinationRecords(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const vaccinationRecords = await this.getVaccinationRecordsByUserUseCase.execute(userId);

      res.status(200).json({
        message: 'Registros de vacinação listados com sucesso',
        data: vaccinationRecords,
        total: vaccinationRecords.length
      });
    } catch (error) {
      console.error('Erro ao listar registros de vacinação do usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getVaccinationRecordsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ message: 'ID do usuário é obrigatório' });
        return;
      }

      const vaccinationRecords = await this.getVaccinationRecordsByUserUseCase.execute(userId);

      res.status(200).json({
        message: 'Registros de vacinação do usuário listados com sucesso',
        data: vaccinationRecords,
        total: vaccinationRecords.length
      });
    } catch (error) {
      console.error('Erro ao listar registros de vacinação do usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}