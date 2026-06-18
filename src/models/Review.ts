import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  userId: Types.ObjectId;
  contentId: Types.ObjectId;
  contentModelType: 'Movie' | 'Content';
  rating: number; // e.g. 1-5
  comment: string;
  status: 'published' | 'hidden';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contentId: { type: Schema.Types.ObjectId, required: true },
    contentModelType: { type: String, enum: ['Movie', 'Content'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    status: { type: String, enum: ['published', 'hidden'], default: 'published' },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);
