import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserDocument extends Document {
  _id: string; // Firebase UID
  uid: string; // Firebase UID (redundant but explicit)
  name: string;
  email: string;
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
  _id: {
    type: String,
    required: true
  },
  uid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name must have at most 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  role: {
    type: String,
    enum: {
      values: ["public", "agent", "admin"],
      message: 'Role must be: public, agent or admin'
    },
    required: [true, 'Role is required'],
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

UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.assignedUnitsIds': 1 });

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
