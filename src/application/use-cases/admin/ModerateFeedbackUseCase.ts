import { FeedbackRepository } from '../../../domain/repositories/FeedbackRepository';

export interface ModerateFeedbackRequest {
  moderatedBy: string;
  isActive: boolean;
}

export class ModerateFeedbackUseCase {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async execute(id: string, data: ModerateFeedbackRequest): Promise<boolean> {
    if (!id) {
      throw new Error('Feedback ID is required');
    }

    if (!data.moderatedBy) {
      throw new Error('Moderator ID is required');
    }

    const feedback = await this.feedbackRepository.findById(id);
    
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    const updateData = {
      isActive: data.isActive,
      moderatedBy: data.moderatedBy,
      moderatedAt: new Date()
    };

    return this.feedbackRepository.update(id, updateData);
  }
}