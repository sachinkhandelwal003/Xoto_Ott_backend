
import mongoose, { Schema, Document } from 'mongoose';

export interface IPage extends Document {
  slug: string;
  title: string;
  content: string;
  status: 'published' | 'draft';
  order: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
    },
    order: { type: Number, default: 0 },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const PageModel = mongoose.model<IPage>('Page', PageSchema);

