export type UserRole = "admin" | "agent" | "public";

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
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
