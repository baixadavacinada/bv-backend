import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthUnit extends Document {
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  operatingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  availableVaccines?: string[];
  geolocation?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  isFavorite: boolean;
}

const HealthUnitSchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  phone: { type: String },
  operatingHours: {
    monday: { type: String },
    tuesday: { type: String },
    wednesday: { type: String },
    thursday: { type: String },
    friday: { type: String },
    saturday: { type: String },
    sunday: { type: String }
  },
  availableVaccines: [{ type: String }],
  geolocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  isActive: { type: Boolean, default: true },
  isFavorite: { type: Boolean, default: false },
});

export const HealthUnitModel = mongoose.model<IHealthUnit>('HealthUnit', HealthUnitSchema);
