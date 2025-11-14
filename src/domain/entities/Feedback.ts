export interface Feedback {
  _id?: string;
  healthUnitId: string;
  userId?: string;
  rating: number;
  vaccineSuccessRating: number;
  waitTimeRating: number;
  respectfulServiceRating: number;
  cleanLocationRating: number;
  npsScore: number;
  isAnonymous: boolean;
  isActive: boolean;
  moderatedBy?: string;
  moderatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
