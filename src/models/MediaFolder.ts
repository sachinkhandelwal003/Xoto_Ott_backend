import mongoose, { Schema, Document } from "mongoose";

export interface IMediaFolder extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaFolderSchema = new Schema<IMediaFolder>(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

MediaFolderSchema.virtual("fileCount", {
  ref: "MediaFile",
  localField: "_id",
  foreignField: "folder",
  count: true,
});

export const MediaFolderModel = mongoose.model<IMediaFolder>("MediaFolder", MediaFolderSchema);
