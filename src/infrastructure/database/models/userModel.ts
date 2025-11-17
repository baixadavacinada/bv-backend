import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserDocument extends Document {
  _id: string; // Firebase UID
  uid: string; // Firebase UID (redundant but explicit)
  name: string;
  email: string;
  role: "public" | "agent" | "admin";
  phone?: string; // Phone number for contact and WhatsApp
  acceptWhatsAppNotifications?: boolean; // User consent for WhatsApp notifications
  profile?: {
    assignedUnitsIds?: Types.ObjectId[];
    favoritesHealthUnit?: Array<{
      healthUnitId: Types.ObjectId;
      isFavorite: boolean;
      addedAt: Date;
    }>;
    favoriteEducationalMaterials?: Array<{
      materialId: string;
      link?: string;
      addedAt: Date;
    }>;
    vaccines?: Array<{
      vaccineId: string;
      vaccineName: string;
      manufacturer?: string;
      dose?: string;
      batchNumber?: string;
      applicationDate?: string;
      healthUnitName?: string;
      city?: string;
      state?: string;
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
  phone: {
    type: String,
    trim: true,
    sparse: true // Allow multiple null values
  },
  acceptWhatsAppNotifications: {
    type: Boolean,
    default: false
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
    }],
    favoriteEducationalMaterials: [{
      materialId: {
        type: String,
        required: true
      },
      link: {
        type: String,
        trim: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    vaccines: [{
      vaccineId: {
        type: String,
        required: true
      },
      vaccineName: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, 'Vaccine name must have at most 100 characters']
      },
      manufacturer: {
        type: String,
        trim: true,
        maxLength: [100, 'Manufacturer must have at most 100 characters']
      },
      dose: {
        type: String,
        trim: true,
        enum: {
          values: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'],
          message: 'Invalid dose type'
        }
      },
      batchNumber: {
        type: String,
        trim: true,
        maxLength: [50, 'Batch number must have at most 50 characters']
      },
      applicationDate: {
        type: String,
        trim: true
      },
      healthUnitName: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true,
        maxLength: [2, 'State code must have at most 2 characters']
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
UserSchema.index({ phone: 1 });
UserSchema.index({ acceptWhatsAppNotifications: 1 });

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
