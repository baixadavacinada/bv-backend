export interface Feedback {
  _id?: string;
  healthUnitId: string;
  userId?: string;
  comment: string;
  rating: number;
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
