import { Schema, model, Document, Types } from "mongoose";

export interface NotificationDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: {
    appointmentId?: Types.ObjectId;
    vaccineId?: Types.ObjectId;
    healthUnitId?: Types.ObjectId;
    actionUrl?: string;
  };
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'User ID is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxLength: [100, 'Title must have at most 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxLength: [500, 'Message must have at most 500 characters']
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['appointment_reminder', 'vaccine_available', 'dose_due', 'system_update', 'general'],
        message: 'Type must be: appointment_reminder, vaccine_available, dose_due, system_update or general'
      }
    },
    isRead: {
      type: Boolean,
      default: false
    },
    data: {
      appointmentId: {
        type: Schema.Types.ObjectId,
        ref: "Appointment"
      },
      vaccineId: {
        type: Schema.Types.ObjectId,
        ref: "Vaccine"
      },
      healthUnitId: {
        type: Schema.Types.ObjectId,
        ref: "HealthUnit"
      },
      actionUrl: {
        type: String,
        maxLength: [200, 'Action URL must have at most 200 characters']
      }
    },
    scheduledFor: {
      type: Date
    },
    sentAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ type: 1 });

export const NotificationModel = model<NotificationDocument>("Notification", notificationSchema);