import type { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { ContentModel } from '../models/Content';
import { MovieModel } from '../models/Movie';
import { UserLikeModel } from '../models/UserLike';
import { logger } from '../lib/logger';

// Helper: fetch content by id from the right collection
const findContent = async (contentId: string, contentType: string) => {
  if (contentType === 'movie') {
    return MovieModel.findById(contentId).select('likes').lean();
  }
  return ContentModel.findById(contentId).select('likes').lean();
};

// Helper: atomically increment / decrement likes in the right collection
const updateLikes = async (contentId: string, contentType: string, increment: 1 | -1) => {
  if (contentType === 'movie') {
    return MovieModel.findByIdAndUpdate(
      contentId,
      { $inc: { likes: increment } },
      { new: true }
    ).select('likes').lean();
  }
  return ContentModel.findByIdAndUpdate(
    contentId,
    { $inc: { likes: increment } },
    { new: true }
  ).select('likes').lean();
};

// POST /api/like/:contentId
// Body: { contentType: 'drama' | 'movie' }
// Header: Authorization: Bearer <token>
export const toggleLike = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // ── 1. Verify JWT (required) ─────────────────────────────────────────────
    let userId: string;
    try {
      await request.jwtVerify();
      userId = (request.user as any).id;
    } catch {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required. Please login to like content.',
      });
    }

    // ── 2. Parse params & body ────────────────────────────────────────────────
    const { contentId } = request.params as { contentId: string };
    const body = request.body as { contentType?: 'drama' | 'movie' };
    const contentType = body?.contentType || 'drama';
    const contentModelType: 'Content' | 'Movie' = contentType === 'movie' ? 'Movie' : 'Content';

    // Validate contentId
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid contentId.',
      });
    }

    // ── 3. Verify content exists ──────────────────────────────────────────────
    const content = await findContent(contentId, contentType);
    if (!content) {
      return reply.status(404).send({
        success: false,
        message: 'Content not found.',
      });
    }

    // ── 4. Toggle like ────────────────────────────────────────────────────────
    const existingLike = await UserLikeModel.findOne({ userId, contentId });

    if (existingLike) {
      // Already liked → UNLIKE
      await UserLikeModel.deleteOne({ _id: existingLike._id });
      const updated = await updateLikes(contentId, contentType, -1);
      const likeCount = Math.max(0, (updated as any)?.likes ?? 0);

      logger.info({ userId, contentId, contentType }, 'User unliked content');

      return reply.send({
        success: true,
        message: 'Video unliked successfully',
        data: {
          likeCount,
          isLikedByUser: false,
        },
      });
    } else {
      // Not liked → LIKE
      await UserLikeModel.create({ userId, contentId, contentModelType });
      const updated = await updateLikes(contentId, contentType, 1);
      const likeCount = (updated as any)?.likes ?? 0;

      logger.info({ userId, contentId, contentType }, 'User liked content');

      return reply.send({
        success: true,
        message: 'Video liked successfully',
        data: {
          likeCount,
          isLikedByUser: true,
        },
      });
    }
  } catch (error: any) {
    logger.error(error, 'Error toggling like');
    return reply.status(500).send({
      success: false,
      message: 'Failed to process like.',
      error: error.message,
    });
  }
};
