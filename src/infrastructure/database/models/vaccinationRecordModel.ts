import { Schema, model, Document, Types } from "mongoose";

export interface VaccinationRecordDocument extends Document {
  residentId: Types.ObjectId;
  vaccineId: Types.ObjectId;
  healthUnitId: Types.ObjectId;
  dose: string;
  date: Date;
  appliedBy: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vaccinationRecordSchema = new Schema<VaccinationRecordDocument>(
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
    dose: {
      type: String,
      required: [true, 'Dose is required'],
      enum: {
        values: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'],
        message: 'Dose must be: 1ª dose, 2ª dose, 3ª dose, dose única or reforço'
      }
    },
    date: {
      type: Date,
      required: [true, 'Application date is required'],
      validate: {
        validator: function(date: Date) {
          return date <= new Date();
        },
        message: 'Application date cannot be in the future'
      }
    },
    appliedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Applicator agent is required']
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
    },
    notes: {
      type: String,
      maxLength: [500, 'Notes must have at most 500 characters']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

vaccinationRecordSchema.index({ residentId: 1, vaccineId: 1 });
vaccinationRecordSchema.index({ healthUnitId: 1, date: -1 });
vaccinationRecordSchema.index({ appliedBy: 1 });
vaccinationRecordSchema.index({ isActive: 1 });

export const VaccinationRecordModel = model<VaccinationRecordDocument>("VaccinationRecord", vaccinationRecordSchema);
