import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEpisode extends Document {
  contentId: Types.ObjectId;
  season: number;
  episode: number;
  title: string;
  description?: string;
  thumbnail?: string;
  hlsUrl?: string;
  trailerUrl?: string;
  duration?: number;
  views: number;
  downloadAllowed: boolean;
  subtitleLanguages: string[];
  audioLanguages: string[];
  airDate?: Date;
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeSchema = new Schema<IEpisode>(
  {
    contentId: { type: Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    season: { type: Number, required: true, min: 1 },
    episode: { type: Number, required: true, min: 1 },
    title: { type: String, required: true },
    description: String,
    thumbnail: String,
    hlsUrl: String,
    trailerUrl: String,
    duration: Number,
    views: { type: Number, default: 0 },
    downloadAllowed: { type: Boolean, default: false },
    subtitleLanguages: { type: [String], default: [] },
    audioLanguages: { type: [String], default: [] },
    airDate: Date,
    isFree: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

EpisodeSchema.index({ contentId: 1, season: 1, episode: 1 }, { unique: true });

export const EpisodeModel = mongoose.model<IEpisode>('Episode', EpisodeSchema);
