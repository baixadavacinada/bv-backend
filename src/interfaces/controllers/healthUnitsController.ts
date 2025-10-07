import { Request, Response } from "express";
import { ListHealthUnitsUseCase } from "../../application/use-cases/public/ListHealthUnitsUseCase";
import { Logger } from "../../middlewares/logging";

const logger = Logger.getInstance();
const listHealthUnitsUseCase = new ListHealthUnitsUseCase();

export async function listHealthUnitsController(req: Request, res: Response) {
  try {
    const { city, isActive, isFavorite, neighborhood } = req.query;
    
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (isFavorite !== undefined) filters.isFavorite = isFavorite === "true";
    if (neighborhood) filters.neighborhood = neighborhood as string;
    
    logger.info('Fetching health units', { filters });
    
    const units = await listHealthUnitsUseCase.execute(filters);
    
    logger.info('Health units fetched successfully', { 
      count: units.length,
      filters 
    });
    
    return res.status(200).json({
      success: true,
      data: units,
      message: 'Health units retrieved successfully',
      count: units.length
    });
  } catch (error) {
    logger.error('Error fetching health units', error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Error fetching health units'
      }
    });
  }
}