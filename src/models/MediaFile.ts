import mongoose, { Schema, Document } from "mongoose";

export interface IMediaFile extends Document {
  name: string;
  url: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  folder: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaFileSchema = new Schema<IMediaFile>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    folder: { type: Schema.Types.ObjectId, ref: "MediaFolder", required: true },
  },
  { timestamps: true }
);

export const MediaFileModel = mongoose.model<IMediaFile>("MediaFile", MediaFileSchema);
