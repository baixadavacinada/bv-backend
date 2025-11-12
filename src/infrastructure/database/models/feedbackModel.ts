import { Schema, model, Document, Types } from "mongoose";

export interface FeedbackDocument extends Document {
  healthUnitId: Types.ObjectId;
  userId?: Types.ObjectId;
  rating: number;
  vaccineSuccess?: string;
  waitTime?: string;
  respectfulService?: string;
  cleanLocation?: string;
  recommendation?: string;
  isAnonymous: boolean;
  isActive: boolean;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDocument>(
  {
    healthUnitId: {
      type: Schema.Types.ObjectId,
      ref: "HealthUnit",
      required: [true, 'ID da unidade de saúde é obrigatório']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"

    },
    rating: {
      type: Number,
      min: [1, 'Avaliação mínima é 1'],
      max: [5, 'Avaliação máxima é 5'],
      required: [true, 'Avaliação é obrigatória']
    },
    vaccineSuccess: {
      type: String,
      trim: true,
      maxLength: [500, 'Campo de sucesso da vacina deve ter no máximo 500 caracteres']
    },
    waitTime: {
      type: String,
      trim: true,
      maxLength: [500, 'Campo de tempo de espera deve ter no máximo 500 caracteres']
    },
    respectfulService: {
      type: String,
      trim: true,
      maxLength: [500, 'Campo de atendimento respeitoso deve ter no máximo 500 caracteres']
    },
    cleanLocation: {
      type: String,
      trim: true,
      maxLength: [500, 'Campo de local limpo deve ter no máximo 500 caracteres']
    },
    recommendation: {
      type: String,
      trim: true,
      maxLength: [500, 'Campo de recomendação deve ter no máximo 500 caracteres']
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    moderatedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

feedbackSchema.index({ healthUnitId: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ isActive: 1 });
feedbackSchema.index({ userId: 1 });

export const FeedbackModel = model<FeedbackDocument>("Feedback", feedbackSchema);
