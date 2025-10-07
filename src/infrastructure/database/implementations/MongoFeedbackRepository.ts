import { Feedback } from "../../../domain/entities/Feedback";
import { FeedbackRepository } from "../../../domain/repositories/FeedbackRepository";
import { FeedbackModel } from "../models/feedbackModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoFeedbackRepository implements FeedbackRepository {
  async create(data: Feedback): Promise<Feedback> {
    const created = await FeedbackModel.create(data);
    return convertObjectIdToString<typeof created, Feedback>(created);
  }

  async findById(id: string): Promise<Feedback | null> {
    const feedback = await FeedbackModel.findById(id).lean();
    return feedback ? convertLeanDocumentToString<Feedback>(feedback) : null;
  }

  async findAll(): Promise<Feedback[]> {
    const feedbacks = await FeedbackModel.find().lean();
    return convertLeanArrayToString<Feedback>(feedbacks);
  }

  async listByHealthUnit(healthUnitId: string): Promise<Feedback[]> {
    const feedbacks = await FeedbackModel.find({ healthUnitId }).lean();
    return convertLeanArrayToString<Feedback>(feedbacks);
  }
}
