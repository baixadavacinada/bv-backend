import { Request, Response } from 'express';
import { MongoVaccinationRecordRepository } from '../../../infrastructure/database/implementations/MongoVaccinationRecordRepository';
import { CreateVaccinationRecordUseCase } from '../../../application/use-cases/admin/CreateVaccinationRecordUseCase';
import { UpdateVaccinationRecordUseCase } from '../../../application/use-cases/admin/UpdateVaccinationRecordUseCase';
import { DeleteVaccinationRecordUseCase } from '../../../application/use-cases/admin/DeleteVaccinationRecordUseCase';
import { GetVaccinationRecordByIdUseCase } from '../../../application/use-cases/admin/GetVaccinationRecordByIdUseCase';
import { ListVaccinationRecordsUseCase } from '../../../application/use-cases/admin/ListVaccinationRecordsUseCase';

export class VaccinationRecordController {
  private vaccinationRecordRepository = new MongoVaccinationRecordRepository();
  private createVaccinationRecordUseCase = new CreateVaccinationRecordUseCase(this.vaccinationRecordRepository);
  private updateVaccinationRecordUseCase = new UpdateVaccinationRecordUseCase(this.vaccinationRecordRepository);
  private deleteVaccinationRecordUseCase = new DeleteVaccinationRecordUseCase(this.vaccinationRecordRepository);
  private getVaccinationRecordByIdUseCase = new GetVaccinationRecordByIdUseCase(this.vaccinationRecordRepository);
  private listVaccinationRecordsUseCase = new ListVaccinationRecordsUseCase(this.vaccinationRecordRepository);

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { residentId, vaccineId, healthUnitId, appliedBy, dose, date, notes } = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      if (!residentId || !vaccineId || !healthUnitId || !appliedBy || !dose || !date) {
        res.status(400).json({ message: 'Campos obrigatórios: residentId, vaccineId, healthUnitId, appliedBy, dose, date' });
        return;
      }

      const vaccinationRecord = await this.createVaccinationRecordUseCase.execute({
        residentId,
        vaccineId,
        healthUnitId,
        appliedBy,
        createdBy,
        dose,
        date: new Date(date),
        notes
      });

      res.status(201).json({
        message: 'Registro de vacinação criado com sucesso',
        data: vaccinationRecord
      });
    } catch (error) {
      console.error('Erro ao criar registro de vacinação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { healthUnitId, startDate, endDate, residentId, vaccineId } = req.query;

      const filters: any = {};
      
      if (healthUnitId) filters.healthUnitId = healthUnitId as string;
      if (residentId) filters.residentId = residentId as string;
      if (vaccineId) filters.vaccineId = vaccineId as string;
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) filters.dateRange.start = new Date(startDate as string);
        if (endDate) filters.dateRange.end = new Date(endDate as string);
      }

      const vaccinationRecords = await this.listVaccinationRecordsUseCase.execute(filters);

      res.status(200).json({
        message: 'Registros de vacinação listados com sucesso',
        data: vaccinationRecords,
        total: vaccinationRecords.length
      });
    } catch (error) {
      console.error('Erro ao listar registros de vacinação:', error);
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

      const vaccinationRecord = await this.getVaccinationRecordByIdUseCase.execute(id);

      if (!vaccinationRecord) {
        res.status(404).json({ message: 'Registro de vacinação não encontrado' });
        return;
      }

      res.status(200).json({
        message: 'Registro de vacinação encontrado',
        data: vaccinationRecord
      });
    } catch (error) {
      console.error('Erro ao buscar registro de vacinação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes, dose, date } = req.body;
      const updatedBy = req.user?.id;

      if (!id) {
        res.status(400).json({ message: 'ID é obrigatório' });
        return;
      }

      if (!updatedBy) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const updateData: any = { updatedBy };
      if (notes !== undefined) updateData.notes = notes;
      if (dose !== undefined) updateData.dose = dose;
      if (date !== undefined) updateData.date = new Date(date);

      const vaccinationRecord = await this.updateVaccinationRecordUseCase.execute(id, updateData);

      if (!vaccinationRecord) {
        res.status(404).json({ message: 'Registro de vacinação não encontrado' });
        return;
      }

      res.status(200).json({
        message: 'Registro de vacinação atualizado com sucesso',
        data: vaccinationRecord
      });
    } catch (error) {
      console.error('Erro ao atualizar registro de vacinação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID é obrigatório' });
        return;
      }

      const deleted = await this.deleteVaccinationRecordUseCase.execute(id);

      if (!deleted) {
        res.status(404).json({ message: 'Registro de vacinação não encontrado' });
        return;
      }

      res.status(200).json({
        message: 'Registro de vacinação excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir registro de vacinação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}