export interface Feedback {
  _id?: string;
  healthUnitId: string;
  userId?: string;
  comment: string;
  rating: number;
  isAnonymous: boolean;
  isActive: boolean;
  moderatedBy?: string;
  moderatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
