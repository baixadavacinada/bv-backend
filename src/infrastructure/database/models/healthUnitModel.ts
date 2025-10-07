import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthUnit extends Document {
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  operatingHours?: string;
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
  operatingHours: { type: String },
  availableVaccines: [{ type: String }],
  geolocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  isActive: { type: Boolean, default: true },
  isFavorite: { type: Boolean, default: false },
});

export const HealthUnitModel = mongoose.model<IHealthUnit>('HealthUnit', HealthUnitSchema);
