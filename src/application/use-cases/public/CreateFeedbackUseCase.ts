import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export interface CreateFeedbackRequest {
  healthUnitId: string;
  userId?: string;
  rating?: number;
  // New numeric ratings (1-5 scale)
  vaccineSuccessRating?: number;
  waitTimeRating?: number;
  respectfulServiceRating?: number;
  cleanLocationRating?: number;
  // NPS score (0-10)
  npsScore?: number;
  // Legacy string fields for backward compatibility
  vaccineSuccess?: string;
  waitTime?: string;
  respectfulService?: string;
  cleanLocation?: string;
  recommendation?: string;
  isAnonymous: boolean;
}

export class CreateFeedbackUseCase {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async execute(data: CreateFeedbackRequest): Promise<Feedback> {
    // Validate rating if provided (backward compatibility)
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Validate numeric ratings (1-5)
    if (data.vaccineSuccessRating !== undefined && (data.vaccineSuccessRating < 1 || data.vaccineSuccessRating > 5)) {
      throw new Error('vaccineSuccessRating must be between 1 and 5');
    }
    if (data.waitTimeRating !== undefined && (data.waitTimeRating < 1 || data.waitTimeRating > 5)) {
      throw new Error('waitTimeRating must be between 1 and 5');
    }
    if (data.respectfulServiceRating !== undefined && (data.respectfulServiceRating < 1 || data.respectfulServiceRating > 5)) {
      throw new Error('respectfulServiceRating must be between 1 and 5');
    }
    if (data.cleanLocationRating !== undefined && (data.cleanLocationRating < 1 || data.cleanLocationRating > 5)) {
      throw new Error('cleanLocationRating must be between 1 and 5');
    }

    // Validate NPS score (0-10)
    if (data.npsScore !== undefined && (data.npsScore < 0 || data.npsScore > 10)) {
      throw new Error('npsScore must be between 0 and 10');
    }

    const feedback: Feedback = {
      healthUnitId: data.healthUnitId,
      userId: data.isAnonymous ? undefined : data.userId,
      rating: data.rating,
      vaccineSuccessRating: data.vaccineSuccessRating,
      waitTimeRating: data.waitTimeRating,
      respectfulServiceRating: data.respectfulServiceRating,
      cleanLocationRating: data.cleanLocationRating,
      npsScore: data.npsScore,
      vaccineSuccess: data.vaccineSuccess?.trim(),
      waitTime: data.waitTime?.trim(),
      respectfulService: data.respectfulService?.trim(),
      cleanLocation: data.cleanLocation?.trim(),
      recommendation: data.recommendation?.trim(),
      isAnonymous: data.isAnonymous,
      isActive: true,
      createdAt: new Date()
    };

    return this.feedbackRepository.create(feedback);
  }
}