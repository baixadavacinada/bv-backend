import { Feedback } from "../entities/Feedback";

export interface FeedbackRepository {
  create(data: Feedback): Promise<Feedback>;
  findById(id: string): Promise<Feedback | null>;
  findAll(): Promise<Feedback[]>;
  listByHealthUnit(healthUnitId: string): Promise<Feedback[]>;
}
