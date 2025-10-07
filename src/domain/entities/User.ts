export type UserRole = "admin" | "agent" | "public";

export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  profile?: {
    assignedUnitsIds?: string[];
    favoritesHealthUnit?: Array<{
      healthUnitId: string;
      isFavorite: boolean;
      addedAt: Date;
    }>;
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
