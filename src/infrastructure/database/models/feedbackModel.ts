import { Schema, model, Document, Types } from "mongoose";

export interface FeedbackDocument extends Document {
  healthUnitId: Types.ObjectId;
  userId?: Types.ObjectId;
  rating: number;
  vaccineSuccessRating: number;
  waitTimeRating: number;
  respectfulServiceRating: number;
  cleanLocationRating: number;
  npsScore: number;
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
      required: [true, 'Avaliação com estrelas é obrigatória'],
      min: [1, 'Avaliação mínima é 1'],
      max: [5, 'Avaliação máxima é 5']
    },
    vaccineSuccessRating: {
      type: Number,
      required: [true, 'Avaliação de vacina é obrigatória'],
      min: [1, 'Mínimo 1'],
      max: [5, 'Máximo 5']
    },
    waitTimeRating: {
      type: Number,
      required: [true, 'Avaliação de tempo de espera é obrigatória'],
      min: [1, 'Mínimo 1'],
      max: [5, 'Máximo 5']
    },
    respectfulServiceRating: {
      type: Number,
      required: [true, 'Avaliação de atendimento é obrigatória'],
      min: [1, 'Mínimo 1'],
      max: [5, 'Máximo 5']
    },
    cleanLocationRating: {
      type: Number,
      required: [true, 'Avaliação de limpeza é obrigatória'],
      min: [1, 'Mínimo 1'],
      max: [5, 'Máximo 5']
    },
    npsScore: {
      type: Number,
      required: [true, 'Score NPS é obrigatório'],
      min: [0, 'NPS mínimo é 0'],
      max: [10, 'NPS máximo é 10']
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
