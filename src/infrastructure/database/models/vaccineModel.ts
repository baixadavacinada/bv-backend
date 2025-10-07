import mongoose, { Schema, Document, Types } from "mongoose";

export interface VaccineDocument extends Document {
  name: string;
  manufacturer: string;
  doses: string[];
  ageGroup: string;
  description?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VaccineSchema = new Schema<VaccineDocument>({
  name: {
    type: String,
    required: [true, 'Nome da vacina é obrigatório'],
    trim: true,
    maxLength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  manufacturer: {
    type: String,
    required: [true, 'Fabricante é obrigatório'],
    trim: true,
    maxLength: [100, 'Fabricante deve ter no máximo 100 caracteres']
  },
  doses: {
    type: [String],
    required: [true, 'Doses são obrigatórias'],
    validate: {
      validator: function(doses: string[]) {
        return doses.length > 0;
      },
      message: 'Deve ter pelo menos uma dose'
    }
  },
  ageGroup: {
    type: String,
    required: [true, 'Faixa etária é obrigatória'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Descrição deve ter no máximo 500 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, 'Usuário criador é obrigatório']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true,
  versionKey: false
});

VaccineSchema.index({ name: 1 });
VaccineSchema.index({ manufacturer: 1 });
VaccineSchema.index({ ageGroup: 1 });
VaccineSchema.index({ isActive: 1 });

export const VaccineModel = mongoose.model<VaccineDocument>("Vaccine", VaccineSchema);
