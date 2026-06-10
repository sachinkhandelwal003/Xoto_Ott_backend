import mongoose, { Schema, Document } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GenreSchema = new Schema<IGenre>(
  {
    name: { type: String, required: true, index: true },
    description: String,
    image: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const GenreModel = mongoose.model<IGenre>('Genre', GenreSchema);
