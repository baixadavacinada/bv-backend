import { Request, Response } from "express";
import { MongoVaccineRepository } from "../../../infrastructure/database/implementations/MongoVaccineRepository";
import { ListVaccinesUseCase } from "../../../application/use-cases/public/ListVaccinesUseCase";
import { Logger } from "../../../middlewares/logging";

const logger = Logger.getInstance();
const vaccineRepository = new MongoVaccineRepository();
const listVaccinesUseCase = new ListVaccinesUseCase(vaccineRepository);

export async function createVaccineController(req: Request, res: Response) {
  try {
    const vaccineData = {
      ...req.body,
      createdBy: req.user?.email || req.user?.firebaseUid || req.user?.id || req.body.createdBy
    };

    const vaccine = await vaccineRepository.create(vaccineData);
    
    logger.info('Vaccine created successfully', { vaccineId: vaccine._id, name: vaccine.name });
    
    return res.status(201).json({
      success: true,
      data: vaccine,
      message: 'Vacina criada com sucesso'
    });
  } catch (error) {
    logger.error('Error creating vaccine', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          details: error.message
        }
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Erro interno ao criar vacina'
      }
    });
  }
}

export async function listVaccinesController(req: Request, res: Response) {
  try {
    const vaccines = await listVaccinesUseCase.execute();
    
    logger.info('Vaccines listed successfully', { count: vaccines.length });
    
    return res.status(200).json({
      success: true,
      data: vaccines,
      message: 'Vacinas recuperadas com sucesso',
      count: vaccines.length
    });
  } catch (error) {
    logger.error('Error listing vaccines', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar vacinas'
      }
    });
  }
}

export async function getVaccineController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const vaccine = await vaccineRepository.findById(id);
    
    if (!vaccine) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Vacina não encontrada'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: vaccine,
      message: 'Vacina recuperada com sucesso'
    });
  } catch (error) {
    logger.error('Error getting vaccine', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar vacina'
      }
    });
  }
}

export async function updateVaccineController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.firebaseUid || req.user?.id || req.body.updatedBy
    };

    const existingVaccine = await vaccineRepository.findById(id);
    if (!existingVaccine) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Vacina não encontrada'
        }
      });
    }

    const updatedVaccine = await vaccineRepository.update(id, updateData);
    
    logger.info('Vaccine updated successfully', { vaccineId: id });
    
    return res.status(200).json({
      success: true,
      data: updatedVaccine,
      message: 'Vacina atualizada com sucesso'
    });
  } catch (error) {
    logger.error('Error updating vaccine', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao atualizar vacina'
      }
    });
  }
}

export async function deleteVaccineController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const existingVaccine = await vaccineRepository.findById(id);
    if (!existingVaccine) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Vacina não encontrada'
        }
      });
    }

    await vaccineRepository.update(id, { 
      isActive: false, 
      updatedBy: req.user?.firebaseUid || req.user?.id 
    });
    
    logger.info('Vaccine deleted successfully', { vaccineId: id });
    
    return res.status(200).json({
      success: true,
      message: 'Vacina removida com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting vaccine', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Erro ao remover vacina'
      }
    });
  }
}
