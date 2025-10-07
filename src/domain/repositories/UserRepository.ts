import { User } from "../entities/User";

export interface UserRepository {
  create(data: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  updateProfile(id: string, data: Partial<User>): Promise<User | null>;
}
