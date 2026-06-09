
import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  title: string;
  description?: string;
  type: 'banner' | 'interstitial' | 'rewarded' | 'native';
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  targetPlatforms: Array<'mobile' | 'tablet' | 'web' | 'tv'>;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  priority: number;
  views: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    title: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['banner', 'interstitial', 'rewarded', 'native'],
      default: 'banner',
    },
    imageUrl: String,
    videoUrl: String,
    linkUrl: String,
    targetPlatforms: {
      type: [String],
      enum: ['mobile', 'tablet', 'web', 'tv'],
      default: ['mobile', 'web'],
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AdModel = mongoose.model<IAd>('Ad', AdSchema);

