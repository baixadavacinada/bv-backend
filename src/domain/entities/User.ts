export type UserRole = "admin" | "agent" | "public";

export interface UserVaccine {
  vaccineId: string;
  vaccineName: string;
  manufacturer?: string;
  dose?: string;
  batchNumber?: string;
  applicationDate?: Date;
  healthUnitName?: string;
  city?: string;
  state?: string;
  addedAt: Date;
}

export interface User {
  _id?: string;
  uid: string; // Firebase UID
  name: string;
  email: string;
  role: UserRole;
  profile?: {
    assignedUnitsIds?: string[];
    favoritesHealthUnit?: Array<{
      healthUnitId: string;
      isFavorite: boolean;
      addedAt: Date;
    }>;
    vaccines?: UserVaccine[];
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
