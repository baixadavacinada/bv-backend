import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export interface CreateFeedbackRequest {
  healthUnitId: string;
  userId?: string;
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

    const feedback: Feedback = {
      healthUnitId: data.healthUnitId,
      userId: data.isAnonymous ? undefined : data.userId,
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