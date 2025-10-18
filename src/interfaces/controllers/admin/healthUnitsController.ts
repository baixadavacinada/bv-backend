import { Request, Response } from 'express';
import { MongoHealthUnitsRepository } from '../../../infrastructure/database/implementations/MongoHealthUnitsRepository';
import { CreateHealthUnitUseCase } from '../../../application/use-cases/admin/CreateHealthUnitUseCase';
import { UpdateHealthUnitUseCase } from '../../../application/use-cases/admin/UpdateHealthUnitUseCase';
import { DeleteHealthUnitUseCase } from '../../../application/use-cases/admin/DeleteHealthUnitUseCase';
import { GetHealthUnitByIdUseCase } from '../../../application/use-cases/admin/GetHealthUnitByIdUseCase';
import { ListHealthUnitsUseCase } from '../../../application/use-cases/public/ListHealthUnitsUseCase';

export class AdminHealthUnitsController {
  private healthUnitsRepository = new MongoHealthUnitsRepository();
  private createHealthUnitUseCase = new CreateHealthUnitUseCase(this.healthUnitsRepository);
  private updateHealthUnitUseCase = new UpdateHealthUnitUseCase(this.healthUnitsRepository);
  private deleteHealthUnitUseCase = new DeleteHealthUnitUseCase(this.healthUnitsRepository);
  private getHealthUnitByIdUseCase = new GetHealthUnitByIdUseCase(this.healthUnitsRepository);
  private listHealthUnitsUseCase = new ListHealthUnitsUseCase(this.healthUnitsRepository);

  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        address,
        neighborhood,
        city,
        state,
        zipCode,
        phone,
        operatingHours,
        availableVaccines,
        geolocation,
        isActive,
        isFavorite
      } = req.body;

      if (!name || !address || !neighborhood || !city || !state || !zipCode) {
        res.status(400).json({
          message: 'Campos obrigatórios: name, address, neighborhood, city, state, zipCode'
        });
        return;
      }

      const healthUnit = await this.createHealthUnitUseCase.execute({
        name,
        address,
        neighborhood,
        city,
        state,
        zipCode,
        phone,
        operatingHours,
        availableVaccines,
        geolocation,
        isActive,
        isFavorite
      });

      res.status(201).json({
        message: 'Unidade de saúde criada com sucesso',
        data: healthUnit
      });
    } catch (error) {
      console.error('Erro ao criar unidade de saúde:', error);

      if (error instanceof Error) {
        if (error.message.includes('Required fields')) {
          res.status(400).json({ message: error.message });
          return;
        }
        
        if (error.message.includes('must be between') || error.message.includes('must be valid')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({ message: 'ID da unidade de saúde é obrigatório' });
        return;
      }

      const healthUnit = await this.updateHealthUnitUseCase.execute(id, updateData);

      if (!healthUnit) {
        res.status(404).json({ message: 'Unidade de saúde não encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Unidade de saúde atualizada com sucesso',
        data: healthUnit
      });
    } catch (error) {
      console.error('Erro ao atualizar unidade de saúde:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ message: 'Unidade de saúde não encontrada' });
          return;
        }
        
        if (error.message.includes('must be between') || error.message.includes('must be valid')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID da unidade de saúde é obrigatório' });
        return;
      }

      const deleted = await this.deleteHealthUnitUseCase.execute(id);

      if (!deleted) {
        res.status(404).json({ message: 'Unidade de saúde não encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Unidade de saúde removida com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover unidade de saúde:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ message: 'Unidade de saúde não encontrada' });
        return;
      }

      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID da unidade de saúde é obrigatório' });
        return;
      }

      const healthUnit = await this.getHealthUnitByIdUseCase.execute(id);

      if (!healthUnit) {
        res.status(404).json({ message: 'Unidade de saúde não encontrada' });
        return;
      }

      res.status(200).json({
        message: 'Unidade de saúde encontrada',
        data: healthUnit
      });
    } catch (error) {
      console.error('Erro ao buscar unidade de saúde:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const { isActive, isFavorite, neighborhood, city, state } = req.query;

      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isFavorite !== undefined) filters.isFavorite = isFavorite === 'true';
      if (neighborhood) filters.neighborhood = neighborhood as string;
      if (city) filters.city = city as string;
      if (state) filters.state = state as string;

      const healthUnits = await this.listHealthUnitsUseCase.execute(filters);

      res.status(200).json({
        message: 'Unidades de saúde listadas com sucesso',
        data: healthUnits,
        total: healthUnits.length
      });
    } catch (error) {
      console.error('Erro ao listar unidades de saúde:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}