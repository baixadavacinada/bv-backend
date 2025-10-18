import { Request, Response } from "express";
import { MongoAppointmentRepository } from "../../infrastructure/database/implementations/MongoAppointmentRepository";
import { MongoVaccinationRecordRepository } from "../../infrastructure/database/implementations/MongoVaccinationRecordRepository";
import { ScheduleAppointmentUseCase } from "../../application/use-cases/public/ScheduleAppointmentUseCase";
import { ListAppointmentsUseCase } from "../../application/use-cases/admin/ListAppointmentsUseCase";
import { GetAppointmentStatsUseCase } from "../../application/use-cases/admin/GetAppointmentStatsUseCase";
import { CompleteAppointmentWithVaccinationUseCase } from "../../application/use-cases/admin/CompleteAppointmentWithVaccinationUseCase";
import { Logger } from "../../middlewares/logging";

const logger = Logger.getInstance();
const appointmentRepository = new MongoAppointmentRepository();
const vaccinationRecordRepository = new MongoVaccinationRecordRepository();
const scheduleAppointmentUseCase = new ScheduleAppointmentUseCase(appointmentRepository);
const listAppointmentsUseCase = new ListAppointmentsUseCase(appointmentRepository);
const getAppointmentStatsUseCase = new GetAppointmentStatsUseCase(appointmentRepository);
const completeAppointmentWithVaccinationUseCase = new CompleteAppointmentWithVaccinationUseCase(
  appointmentRepository,
  vaccinationRecordRepository
);

export async function scheduleAppointmentController(req: Request, res: Response) {
  try {
    const appointmentData = {
      ...req.body,
      residentId: req.user?.firebaseUid || req.user?.id || req.body.residentId,
      createdBy: req.user?.firebaseUid || req.user?.id || req.body.createdBy
    };

    const appointment = await scheduleAppointmentUseCase.execute(appointmentData);
    
    logger.info('Appointment scheduled successfully', { 
      appointmentId: appointment._id, 
      residentId: appointment.residentId 
    });
    
    return res.status(201).json({
      success: true,
      data: appointment,
      message: 'Agendamento criado com sucesso'
    });
  } catch (error) {
    logger.error('Error scheduling appointment', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof Error) {
      if (error.message.includes('not available')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SLOT_NOT_AVAILABLE',
            message: 'Horário não disponível'
          }
        });
      }
      
      if (error.message.includes('already has an active appointment')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_APPOINTMENT',
            message: 'Usuário já possui agendamento ativo para esta vacina'
          }
        });
      }
    }
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'SCHEDULE_ERROR',
        message: 'Erro interno ao criar agendamento'
      }
    });
  }
}

export async function listMyAppointmentsController(req: Request, res: Response) {
  try {
    const userId = req.user?.firebaseUid || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      });
    }

    const appointments = await listAppointmentsUseCase.executeByUser(userId);
    
    logger.info('User appointments listed successfully', { 
      userId, 
      count: appointments.length 
    });
    
    return res.status(200).json({
      success: true,
      data: appointments,
      message: 'Agendamentos recuperados com sucesso',
      count: appointments.length
    });
  } catch (error) {
    logger.error('Error listing user appointments', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar agendamentos'
      }
    });
  }
}

export async function listAllAppointmentsController(req: Request, res: Response) {
  try {
    const { healthUnitId, startDate, endDate } = req.query;
    
    let appointments;
    
    if (healthUnitId) {
      appointments = await listAppointmentsUseCase.executeByHealthUnit(healthUnitId as string);
    } else if (startDate && endDate) {
      appointments = await listAppointmentsUseCase.executeByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      appointments = await listAppointmentsUseCase.executeAll();
    }
    
    logger.info('All appointments listed successfully', { count: appointments.length });
    
    return res.status(200).json({
      success: true,
      data: appointments,
      message: 'Agendamentos recuperados com sucesso',
      count: appointments.length
    });
  } catch (error) {
    logger.error('Error listing appointments', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar agendamentos'
      }
    });
  }
}

export async function getAvailableSlotsController(req: Request, res: Response) {
  try {
    const { healthUnitId, date } = req.query;
    
    if (!healthUnitId || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'healthUnitId e date são obrigatórios'
        }
      });
    }

    const availableSlots = await appointmentRepository.findAvailableSlots(
      healthUnitId as string,
      new Date(date as string)
    );
    
    return res.status(200).json({
      success: true,
      data: availableSlots,
      message: 'Horários disponíveis recuperados com sucesso',
      count: availableSlots.length
    });
  } catch (error) {
    logger.error('Error getting available slots', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar horários disponíveis'
      }
    });
  }
}

export async function updateAppointmentStatusController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const updateData: any = {
      status,
      notes,
      updatedBy: req.user?.firebaseUid || req.user?.id
    };

    // Add specific fields based on status
    if (status === 'confirmed') {
      updateData.confirmedBy = req.user?.firebaseUid || req.user?.id;
    } else if (status === 'completed') {
      updateData.completedBy = req.user?.firebaseUid || req.user?.id;
    }

    const updatedAppointment = await appointmentRepository.update(id, updateData);
    
    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Agendamento não encontrado'
        }
      });
    }
    
    logger.info('Appointment status updated successfully', { appointmentId: id, status });
    
    return res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: 'Status do agendamento atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Error updating appointment status', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao atualizar status do agendamento'
      }
    });
  }
}

export async function cancelAppointmentController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const cancelData = {
      status: 'cancelled' as const,
      notes: reason || 'Cancelado pelo usuário',
      updatedBy: req.user?.firebaseUid || req.user?.id
    };

    const cancelledAppointment = await appointmentRepository.update(id, cancelData);
    
    if (!cancelledAppointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Agendamento não encontrado'
        }
      });
    }
    
    logger.info('Appointment cancelled successfully', { appointmentId: id });
    
    return res.status(200).json({
      success: true,
      data: cancelledAppointment,
      message: 'Agendamento cancelado com sucesso'
    });
  } catch (error) {
    logger.error('Error cancelling appointment', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: 'Erro ao cancelar agendamento'
      }
    });
  }
}

export async function getAppointmentStatsController(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_START_DATE',
            message: 'Data inicial inválida'
          }
        });
      }
    }

    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_END_DATE',
            message: 'Data final inválida'
          }
        });
      }
    }

    const stats = await getAppointmentStatsUseCase.execute(start, end);
    
    logger.info('Appointment stats retrieved successfully', { 
      startDate: start?.toISOString(), 
      endDate: end?.toISOString(),
      totalAppointments: stats.totalAppointments
    });
    
    return res.status(200).json({
      success: true,
      data: stats,
      message: 'Estatísticas de agendamentos recuperadas com sucesso'
    });
  } catch (error) {
    logger.error('Error getting appointment stats', error instanceof Error ? error : new Error(String(error)));
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Erro ao obter estatísticas de agendamentos'
      }
    });
  }
}

export async function completeAppointmentWithVaccinationController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { appliedBy, vaccinationNotes, reactions, nextDoseDate } = req.body;
    const completedBy = req.user?.id;

    if (!completedBy) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      });
    }

    if (!appliedBy) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Campo appliedBy é obrigatório'
        }
      });
    }

    const result = await completeAppointmentWithVaccinationUseCase.execute({
      appointmentId: id,
      completedBy,
      appliedBy,
      vaccinationNotes,
      reactions,
      nextDoseDate: nextDoseDate ? new Date(nextDoseDate) : undefined
    });
    
    logger.info('Appointment completed with vaccination record', { 
      appointmentId: id,
      vaccinationRecordId: result.vaccinationRecord._id
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Agendamento completado e registro de vacinação criado com sucesso'
    });
  } catch (error) {
    logger.error('Error completing appointment with vaccination', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Agendamento não encontrado'
          }
        });
      }
      
      if (error.message.includes('Only confirmed or scheduled')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Apenas agendamentos confirmados ou agendados podem ser completados'
          }
        });
      }
    }
    
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'COMPLETION_ERROR',
        message: 'Erro ao completar agendamento'
      }
    });
  }
}