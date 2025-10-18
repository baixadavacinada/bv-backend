import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';
import { Feedback } from '../../../domain/entities/Feedback';

export class ListFeedbackUseCase {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async executeAll(): Promise<Feedback[]> {
    return this.feedbackRepository.findAll();
  }

  async executeByHealthUnit(healthUnitId: string): Promise<Feedback[]> {
    if (!healthUnitId) {
      throw new Error('Health unit ID is required');
    }

    return this.feedbackRepository.listByHealthUnit(healthUnitId);
  }
}