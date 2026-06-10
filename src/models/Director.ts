import mongoose, { Schema, Document } from 'mongoose';

export interface IDirector extends Document {
  name: string;
  designation: string;
  image: string;
  dateOfBirth: Date;
  birthPlace: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DirectorSchema = new Schema<IDirector>(
  {
    name: { type: String, required: true, index: true },
    designation: { type: String, required: true },
    image: String,
    dateOfBirth: { type: Date, required: true },
    birthPlace: { type: String, required: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const DirectorModel = mongoose.model<IDirector>('Director', DirectorSchema);
