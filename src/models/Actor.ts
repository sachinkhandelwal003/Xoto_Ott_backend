import mongoose, { Schema, Document } from 'mongoose';

export interface IActor extends Document {
  name: string;
  designation: string;
  image: string;
  dateOfBirth: Date;
  birthPlace: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActorSchema = new Schema<IActor>(
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

export const ActorModel = mongoose.model<IActor>('Actor', ActorSchema);
