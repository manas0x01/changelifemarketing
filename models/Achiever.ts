import mongoose, { Schema, Document } from 'mongoose';

export interface IAchiever extends Document {
  achieverName: string;
  profilePhoto?: string;
  rankAchievement?: string;
  locationState?: string;
  description?: string;
  memberType?: 'gold' | 'active';
  isFirstBooster?: boolean;
  displayOrder?: number;
  isVisible?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achieverSchema = new Schema<IAchiever>(
  {
    achieverName: {
      type: String,
      required: [true, 'Achiever name is required'],
      trim: true,
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    profilePhoto: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    rankAchievement: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    locationState: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    memberType: {
      type: String,
      enum: ['gold', 'active'],
      default: 'active',
    },
    isFirstBooster: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

achieverSchema.index({ displayOrder: 1, createdAt: -1 });
achieverSchema.index({ isFirstBooster: 1 });
achieverSchema.index({ isVisible: 1 });

if (mongoose.models.Achiever) delete mongoose.models.Achiever;

export default mongoose.model<IAchiever>('Achiever', achieverSchema);