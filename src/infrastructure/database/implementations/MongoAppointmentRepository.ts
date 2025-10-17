import { Appointment } from "../../../domain/entities/Appointment";
import { AppointmentRepository } from "../../../domain/repositories/AppointmentRepository";
import { AppointmentModel } from "../models/appointmentModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoAppointmentRepository implements AppointmentRepository {
  async create(data: Appointment): Promise<Appointment> {
    const created = await AppointmentModel.create(data);
    return convertObjectIdToString<typeof created, Appointment>(created);
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await AppointmentModel.findById(id)
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .lean();
    return appointment ? convertLeanDocumentToString<Appointment>(appointment) : null;
  }

  async findAll(): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find()
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .sort({ scheduledDate: -1 })
      .lean();
    return convertLeanArrayToString<Appointment>(appointments);
  }

  async findByResidentId(residentId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ residentId, isActive: true })
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .sort({ scheduledDate: -1 })
      .lean();
    return convertLeanArrayToString<Appointment>(appointments);
  }

  async findByHealthUnitId(healthUnitId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ healthUnitId, isActive: true })
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .lean();
    return convertLeanArrayToString<Appointment>(appointments);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({
      scheduledDate: { $gte: startDate, $lte: endDate },
      isActive: true
    })
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .lean();
    return convertLeanArrayToString<Appointment>(appointments);
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment | null> {
    const updated = await AppointmentModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('residentId', 'name email')
      .populate('vaccineId', 'name manufacturer')
      .populate('healthUnitId', 'name address')
      .lean();
    return updated ? convertLeanDocumentToString<Appointment>(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await AppointmentModel.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    return !!result;
  }

  async findAvailableSlots(healthUnitId: string, date: Date): Promise<string[]> {
    // Define working hours (8:00 to 17:00, 30min slots)
    const workingHours = [];
    for (let hour = 8; hour < 17; hour++) {
      workingHours.push(`${hour.toString().padStart(2, '0')}:00`);
      workingHours.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Get booked slots for the date
    const bookedAppointments = await AppointmentModel.find({
      healthUnitId,
      scheduledDate: date,
      status: { $in: ['scheduled', 'confirmed'] },
      isActive: true
    }).select('scheduledTime').lean();

    const bookedSlots = bookedAppointments.map(apt => apt.scheduledTime);
    
    // Return available slots
    return workingHours.filter(slot => !bookedSlots.includes(slot));
  }
}