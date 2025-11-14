import mongoose, { Schema, Document, Types } from "mongoose";

export interface VaccineDocument extends Document {
  name: string;
  manufacturer: string;
  doses: string[];
  ageGroup: string;
  description?: string;
  batchNumber?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaccineSchema = new Schema<VaccineDocument>({
  name: {
    type: String,
    required: [true, 'Vaccine name is required'],
    trim: true,
    maxLength: [100, 'Name must have at most 100 characters']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    maxLength: [100, 'Manufacturer must have at most 100 characters']
  },
  doses: {
    type: [String],
    required: [true, 'Doses are required'],
    validate: {
      validator: function(doses: string[]) {
        return doses.length > 0;
      },
      message: 'Must have at least one dose'
    }
  },
  ageGroup: {
    type: String,
    required: [true, 'Age group is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description must have at most 500 characters']
  },
  batchNumber: {
    type: String,
    trim: true,
    maxLength: [50, 'Batch number must have at most 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: [true, 'Creator user is required']
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true,
  versionKey: false
});

VaccineSchema.index({ name: 1 });
VaccineSchema.index({ manufacturer: 1 });
VaccineSchema.index({ ageGroup: 1 });
VaccineSchema.index({ isActive: 1 });
VaccineSchema.index({ batchNumber: 1 });

export const VaccineModel = mongoose.model<VaccineDocument>("Vaccine", VaccineSchema);
