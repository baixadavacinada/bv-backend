export interface Feedback {
  _id?: string;
  healthUnitId: string;
  userId?: string;
  rating?: number;
  // New numeric ratings (1-5 scale for face emoji)
  vaccineSuccessRating?: number;
  waitTimeRating?: number;
  respectfulServiceRating?: number;
  cleanLocationRating?: number;
  // NPS score (0-10 scale)
  npsScore?: number;
  // Legacy string fields for backward compatibility
  vaccineSuccess?: string;
  waitTime?: string;
  respectfulService?: string;
  cleanLocation?: string;
  recommendation?: string;
  isAnonymous: boolean;
  isActive: boolean;
  moderatedBy?: string;
  moderatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
