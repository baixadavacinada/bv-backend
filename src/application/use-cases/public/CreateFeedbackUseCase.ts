import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export interface CreateFeedbackRequest {
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
}

export class CreateFeedbackUseCase {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async execute(data: CreateFeedbackRequest): Promise<Feedback> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (data.comment.trim().length < 10) {
      throw new Error('Comment must have at least 10 characters');
    }

    if (data.comment.length > 1000) {
      throw new Error('Comment must have at most 1000 characters');
    }

    const feedback: Feedback = {
      healthUnitId: data.healthUnitId,
      userId: data.isAnonymous ? undefined : data.userId,
      comment: data.comment.trim(),
      rating: data.rating,
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