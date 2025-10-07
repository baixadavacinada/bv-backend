import { Schema, model, Document, Types } from "mongoose";

export interface FeedbackDocument extends Document {
  healthUnitId: Types.ObjectId;
  userId?: Types.ObjectId;
  comment: string;
  rating: number;
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
    comment: {
      type: String,
      required: [true, 'Comentário é obrigatório'],
      trim: true,
      minLength: [10, 'Comentário deve ter no mínimo 10 caracteres'],
      maxLength: [1000, 'Comentário deve ter no máximo 1000 caracteres']
    },
    rating: {
      type: Number,
      min: [1, 'Avaliação mínima é 1'],
      max: [5, 'Avaliação máxima é 5'],
      required: [true, 'Avaliação é obrigatória']
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
