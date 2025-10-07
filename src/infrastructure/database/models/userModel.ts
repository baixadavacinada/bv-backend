import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "public" | "agent" | "admin";
  profile?: {
    assignedUnitsIds?: Types.ObjectId[];
    favoritesHealthUnit?: Array<{
      healthUnitId: Types.ObjectId;
      isFavorite: boolean;
      addedAt: Date;
    }>;
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxLength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  passwordHash: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minLength: [6, 'Senha deve ter no mínimo 6 caracteres']
  },
  role: {
    type: String,
    enum: {
      values: ["public", "agent", "admin"],
      message: 'Role deve ser: public, agent ou admin'
    },
    required: [true, 'Role é obrigatória'],
    default: "public"
  },
  profile: {
    assignedUnitsIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "HealthUnit"
    }],
    favoritesHealthUnit: [{
      healthUnitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HealthUnit",
        required: true
      },
      isFavorite: {
        type: Boolean,
        default: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.assignedUnitsIds': 1 });

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
