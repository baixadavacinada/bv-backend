import { Schema, model, Document, Types } from "mongoose";

export interface AppointmentDocument extends Document {
  residentId: Types.ObjectId;
  vaccineId: Types.ObjectId;
  healthUnitId: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  dose: string;
  status: string;
  notes?: string;
  confirmedBy?: Types.ObjectId;
  completedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Resident ID is required']
    },
    vaccineId: {
      type: Schema.Types.ObjectId,
      ref: "Vaccine",
      required: [true, 'Vaccine ID is required']
    },
    healthUnitId: {
      type: Schema.Types.ObjectId,
      ref: "HealthUnit",
      required: [true, 'Health unit ID is required']
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      validate: {
        validator: function(date: Date) {
          return date >= new Date();
        },
        message: 'Scheduled date cannot be in the past'
      }
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      validate: {
        validator: function(time: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    dose: {
      type: String,
      required: [true, 'Dose is required'],
      enum: {
        values: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'],
        message: 'Dose must be: 1ª dose, 2ª dose, 3ª dose, dose única or reforço'
      }
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
        message: 'Status must be: scheduled, confirmed, completed, cancelled or no_show'
      },
      default: 'scheduled'
    },
    notes: {
      type: String,
      maxLength: [500, 'Notes must have at most 500 characters']
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Creator user is required']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for performance
appointmentSchema.index({ residentId: 1, scheduledDate: -1 });
appointmentSchema.index({ healthUnitId: 1, scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledDate: 1, scheduledTime: 1 });

export const AppointmentModel = model<AppointmentDocument>("Appointment", appointmentSchema);