export interface Vaccine {
  _id?: string;
  name: string;
  manufacturer: string;
  doses: string[];
  ageGroup: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
