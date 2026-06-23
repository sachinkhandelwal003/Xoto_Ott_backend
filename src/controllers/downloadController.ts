import type { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { MovieModel } from '../models/Movie';
import { ContentModel } from '../models/Content';
import { EpisodeModel } from '../models/Episode';
import { UserDownloadModel } from '../models/UserDownload';
import { logger } from '../lib/logger';

// Helper to format bytes to MB
const formatSizeMB = (sizeBytes: number): string => {
  return sizeBytes ? `${Math.round(sizeBytes / (1024 * 1024))} MB` : 'N/A';
};

export const requestDownload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userPayload = (request as any).user;
    if (!userPayload || !userPayload.id) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const userId = userPayload.id;
    // Cast userId string to ObjectId for all DB queries
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check user subscription status
    const user = await UserModel.findById(userObjectId).select('subscriptionStatus subscriptionExpiry').lean();
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    const isSubscribed = user.subscriptionStatus === 'active' && (!user.subscriptionExpiry || user.subscriptionExpiry > new Date());
    if (!isSubscribed) {
      return reply.status(403).send({
        success: false,
        message: 'Active subscription required to download content for offline viewing.'
      });
    }

    const { contentId, contentType, episodeId } = request.body as {
      contentId: string;
      contentType: 'movie' | 'drama' | 'series';
      episodeId?: string;
    };

    if (!contentId || !contentType) {
      return reply.status(400).send({ success: false, message: 'contentId and contentType are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return reply.status(400).send({ success: false, message: 'Invalid contentId' });
    }

    let downloadUrl = '';
    let qualities: any[] = [];
    let title = '';
    let parentTitle = '';
    let thumbnail = '';
    let duration = 0;
    let contentModelType: 'Movie' | 'Content' = 'Movie';
    let downloadDoc: any = null;

    if (contentType === 'movie') {
      const movie = await MovieModel.findById(contentId).lean();
      if (!movie || movie.status !== 'published') {
        return reply.status(404).send({ success: false, message: 'Movie not found' });
      }

      if (!movie.downloadAllowed) {
        return reply.status(400).send({ success: false, message: 'Downloading is disabled for this movie.' });
      }

      title = movie.title;
      thumbnail = movie.thumbnail || '';
      duration = movie.duration || 0;
      downloadUrl = movie.hlsUrl || '';
      qualities = (movie.videoQualities || []).map((q: any) => ({
        quality: q.quality,
        label: q.quality.toUpperCase(),
        size: q.size,
        sizeFormatted: formatSizeMB(q.size),
        url: q.url
      }));
      contentModelType = 'Movie';

      // Upsert download record
      downloadDoc = await UserDownloadModel.findOneAndUpdate(
        { userId: userObjectId, contentId, episodeId: null },
        { $setOnInsert: { contentModelType } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      // It's a show/drama series episode
      if (!episodeId) {
        return reply.status(400).send({ success: false, message: 'episodeId is required for drama/series content' });
      }

      if (!mongoose.Types.ObjectId.isValid(episodeId)) {
        return reply.status(400).send({ success: false, message: 'Invalid episodeId' });
      }

      const [drama, episode] = await Promise.all([
        ContentModel.findById(contentId).lean(),
        EpisodeModel.findById(episodeId).lean()
      ]);

      if (!drama || drama.status !== 'published') {
        return reply.status(404).send({ success: false, message: 'Drama/series not found' });
      }

      if (!episode || episode.processingStatus !== 'ready') {
        return reply.status(404).send({ success: false, message: 'Episode not found or not ready' });
      }

      if (!drama.downloadAllowed) {
        return reply.status(400).send({ success: false, message: 'Downloading is disabled for this series.' });
      }

      title = episode.title;
      parentTitle = drama.title;
      thumbnail = episode.thumbnail || drama.thumbnail || '';
      duration = episode.duration || 0;
      downloadUrl = episode.hlsUrl || '';
      qualities = (episode.videoQualities || []).map((q: any) => ({
        quality: q.quality,
        label: q.quality.toUpperCase(),
        size: q.size,
        sizeFormatted: formatSizeMB(q.size),
        url: q.url
      }));
      contentModelType = 'Content';

      // Upsert download record
      downloadDoc = await UserDownloadModel.findOneAndUpdate(
        { userId: userObjectId, contentId, episodeId },
        { $setOnInsert: { contentModelType } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return reply.send({
      success: true,
      message: 'Download request authorized successfully.',
      data: {
        id: downloadDoc?._id?.toString() || null,
        type: contentType,
        title,
        parentTitle: parentTitle || undefined,
        contentType,
        thumbnail,
        duration,
        hlsUrl: downloadUrl,
        videoQualities: qualities
      }
    });

  } catch (error: any) {
    logger.error({ error }, 'Error authorizing download');
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getDownloadsList = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userPayload = (request as any).user;
    if (!userPayload || !userPayload.id) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const userId = userPayload.id;
    // Cast userId string to ObjectId for all DB queries
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const [downloads, total] = await Promise.all([
      UserDownloadModel.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserDownloadModel.countDocuments({ userId: userObjectId })
    ]);

    const movieIds = downloads.filter(d => d.contentModelType === 'Movie').map(d => d.contentId);
    const contentIds = downloads.filter(d => d.contentModelType === 'Content').map(d => d.contentId);
    const episodeIds = downloads.filter(d => d.episodeId).map(d => d.episodeId!);

    const [movies, dramas, episodes] = await Promise.all([
      movieIds.length > 0 ? MovieModel.find({ _id: { $in: movieIds } }).select('title thumbnail duration year rating').lean() : Promise.resolve([]),
      contentIds.length > 0 ? ContentModel.find({ _id: { $in: contentIds } }).select('title thumbnail').lean() : Promise.resolve([]),
      episodeIds.length > 0 ? EpisodeModel.find({ _id: { $in: episodeIds } }).select('title thumbnail duration season episode').lean() : Promise.resolve([])
    ]);

    const movieMap = new Map(movies.map(m => [m._id.toString(), m]));
    const dramaMap = new Map(dramas.map(d => [d._id.toString(), d]));
    const episodeMap = new Map(episodes.map(e => [e._id.toString(), e]));

    const mappedItems = downloads.map(item => {
      const isMovie = item.contentModelType === 'Movie';
      if (isMovie) {
        const m = movieMap.get(item.contentId.toString());
        return {
          id: item._id.toString(),
          contentId: item.contentId.toString(),
          title: m?.title || 'Movie',
          thumbnail: m?.thumbnail || '',
          duration: m?.duration || 0,
          year: m?.year || null,
          rating: m?.rating || null,
          type: 'movie',
          downloadedAt: item.createdAt
        };
      } else {
        const d = dramaMap.get(item.contentId.toString());
        const e = item.episodeId ? episodeMap.get(item.episodeId.toString()) : null;
        return {
          id: item._id.toString(),
          contentId: item.contentId.toString(),
          episodeId: item.episodeId?.toString() || null,
          title: e?.title || d?.title || 'Episode',
          parentTitle: d?.title || '',
          thumbnail: e?.thumbnail || d?.thumbnail || '',
          duration: e?.duration || 0,
          season: e?.season || null,
          episodeNumber: (e as any)?.episode || null,
          type: 'drama',
          downloadedAt: item.createdAt
        };
      }
    });

    return reply.send({
      success: true,
      data: {
        items: mappedItems,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching downloads list');
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const removeDownload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userPayload = (request as any).user;
    if (!userPayload || !userPayload.id) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const userId = userPayload.id;
    // Cast userId string to ObjectId for all DB queries
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { id } = request.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, message: 'Invalid ID' });
    }

    // Try deleting by download log _id first, then by contentId as fallback
    // (some mobile clients send contentId instead of the log _id)
    let download = await UserDownloadModel.findOneAndDelete({ _id: id, userId: userObjectId });
    if (!download) {
      download = await UserDownloadModel.findOneAndDelete({ contentId: id, userId: userObjectId });
    }
    if (!download) {
      return reply.status(404).send({ success: false, message: 'Download not found or already removed' });
    }

    return reply.send({
      success: true,
      message: 'Download log deleted successfully.'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error removing download log');
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};
