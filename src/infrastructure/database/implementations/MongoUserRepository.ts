import { User } from "../../../domain/entities/User";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { UserModel } from "../models/userModel";
import { convertObjectIdToString, convertLeanDocumentToString, convertLeanArrayToString } from "../utils/mongoUtils";

export class MongoUserRepository implements UserRepository {
  async create(data: User): Promise<User> {
    const created = await UserModel.create(data);
    return convertObjectIdToString<typeof created, User>(created);
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).lean();
    return user ? convertLeanDocumentToString<User>(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.find().lean();
    return convertLeanArrayToString<User>(users);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).lean();
    return user ? convertLeanDocumentToString<User>(user) : null;
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User | null> {
    const updated = await UserModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated ? convertLeanDocumentToString<User>(updated) : null;
  }
}
