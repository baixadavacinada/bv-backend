import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export class GetFeedbackByIdUseCase {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async execute(id: string): Promise<Feedback | null> {
    if (!id) {
      throw new Error('Feedback ID is required');
    }

    return this.feedbackRepository.findById(id);
  }
}