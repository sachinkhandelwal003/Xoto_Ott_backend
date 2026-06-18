import type { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { UserWatchProgressModel } from '../models/UserWatchProgress';
import { MovieModel } from '../models/Movie';
import { ContentModel } from '../models/Content';
import { EpisodeModel } from '../models/Episode';
import { logger } from '../lib/logger';

export const saveWatchProgress = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized.' });
    }

    const { contentId, episodeId, progressSeconds, durationSeconds } = request.body as {
      contentId: string;
      episodeId?: string;
      progressSeconds: number;
      durationSeconds: number;
    };

    if (!contentId || progressSeconds === undefined || durationSeconds === undefined) {
      return reply.status(400).send({ success: false, message: 'contentId, progressSeconds, and durationSeconds are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return reply.status(400).send({ success: false, message: 'Invalid contentId.' });
    }

    if (episodeId && !mongoose.Types.ObjectId.isValid(episodeId)) {
      return reply.status(400).send({ success: false, message: 'Invalid episodeId.' });
    }

    // Determine if Movie or Drama (Content)
    let contentModelType: 'Movie' | 'Content';
    const movieDoc = await MovieModel.findById(contentId).lean();
    if (movieDoc) {
      contentModelType = 'Movie';
    } else {
      const contentDoc = await ContentModel.findById(contentId).lean();
      if (contentDoc) {
        contentModelType = 'Content';
      } else {
        return reply.status(404).send({ success: false, message: 'Content or Movie not found.' });
      }
    }

    // If episodeId is provided, make sure the episode exists and belongs to the content
    if (episodeId) {
      const episodeDoc = await EpisodeModel.findOne({ _id: episodeId, contentId }).lean();
      if (!episodeDoc) {
        return reply.status(404).send({ success: false, message: 'Episode not found for this content.' });
      }
    }

    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      contentId: new mongoose.Types.ObjectId(contentId),
      episodeId: episodeId ? new mongoose.Types.ObjectId(episodeId) : null,
    };

    const percent = Math.min(100, Math.max(0, Math.round((progressSeconds / durationSeconds) * 100)));
    const isNearlyCompleted = percent > 95 || (durationSeconds - progressSeconds) <= 10;

    if (isNearlyCompleted) {
      await UserWatchProgressModel.deleteOne(filter);
      return reply.send({
        success: true,
        message: 'Watch progress cleared because the content is nearly completed.',
        data: {
          cleared: true,
          progressPercent: percent,
        },
      });
    }

    const progressDoc = await UserWatchProgressModel.findOneAndUpdate(
      filter,
      {
        contentModelType,
        progressSeconds,
        durationSeconds,
        progressPercent: percent,
        lastWatchedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    return reply.send({
      success: true,
      data: progressDoc,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error saving watch progress');
    return reply.status(500).send({
      success: false,
      message: 'Failed to save watch progress.',
      error: error.message,
    });
  }
};

export const clearWatchProgress = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized.' });
    }

    const { contentId } = request.params as { contentId: string };
    const query = request.query as { episodeId?: string };

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return reply.status(400).send({ success: false, message: 'Invalid contentId.' });
    }

    const filter: any = {
      userId: new mongoose.Types.ObjectId(userId),
      contentId: new mongoose.Types.ObjectId(contentId),
    };

    if (query.episodeId) {
      if (!mongoose.Types.ObjectId.isValid(query.episodeId)) {
        return reply.status(400).send({ success: false, message: 'Invalid episodeId.' });
      }
      filter.episodeId = new mongoose.Types.ObjectId(query.episodeId);
    }

    const deleteResult = await UserWatchProgressModel.deleteMany(filter);

    return reply.send({
      success: true,
      message: 'Watch progress cleared successfully.',
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error clearing watch progress');
    return reply.status(500).send({
      success: false,
      message: 'Failed to clear watch progress.',
      error: error.message,
    });
  }
};
