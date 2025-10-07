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
      required: [true, 'ID do residente é obrigatório']
    },
    vaccineId: {
      type: Schema.Types.ObjectId,
      ref: "Vaccine",
      required: [true, 'ID da vacina é obrigatório']
    },
    healthUnitId: {
      type: Schema.Types.ObjectId,
      ref: "HealthUnit",
      required: [true, 'ID da unidade de saúde é obrigatório']
    },
    dose: {
      type: String,
      required: [true, 'Dose é obrigatória'],
      enum: {
        values: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'],
        message: 'Dose deve ser: 1ª dose, 2ª dose, 3ª dose, dose única ou reforço'
      }
    },
    date: {
      type: Date,
      required: [true, 'Data da aplicação é obrigatória'],
      validate: {
        validator: function(date: Date) {
          return date <= new Date();
        },
        message: 'Data da aplicação não pode ser futura'
      }
    },
    appliedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Agente aplicador é obrigatório']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Usuário criador é obrigatório']
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
      maxLength: [500, 'Observações devem ter no máximo 500 caracteres']
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
