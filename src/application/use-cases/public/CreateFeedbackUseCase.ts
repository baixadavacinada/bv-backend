import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export interface CreateFeedbackRequest {
  healthUnitId: string;
  userId?: string;
  rating: number;
  vaccineSuccessRating: number;
  waitTimeRating: number;
  respectfulServiceRating: number;
  cleanLocationRating: number;
  npsScore: number;
  isAnonymous: boolean;
}

export class CreateFeedbackUseCase {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async execute(data: CreateFeedbackRequest): Promise<Feedback> {
    // Validate rating (1-5)
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Validate numeric ratings (1-5)
    if (data.vaccineSuccessRating < 1 || data.vaccineSuccessRating > 5) {
      throw new Error('vaccineSuccessRating must be between 1 and 5');
    }
    if (data.waitTimeRating < 1 || data.waitTimeRating > 5) {
      throw new Error('waitTimeRating must be between 1 and 5');
    }
    if (data.respectfulServiceRating < 1 || data.respectfulServiceRating > 5) {
      throw new Error('respectfulServiceRating must be between 1 and 5');
    }
    if (data.cleanLocationRating < 1 || data.cleanLocationRating > 5) {
      throw new Error('cleanLocationRating must be between 1 and 5');
    }

    // Validate NPS score (0-10)
    if (data.npsScore < 0 || data.npsScore > 10) {
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
      isAnonymous: data.isAnonymous,
      isActive: true,
      createdAt: new Date()
    };

    return this.feedbackRepository.create(feedback);
  }
}