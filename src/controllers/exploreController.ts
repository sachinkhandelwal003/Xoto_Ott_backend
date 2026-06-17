import type { FastifyReply, FastifyRequest } from 'fastify';
import { ContentModel } from '../models/Content';
import { MovieModel } from '../models/Movie';
import { EpisodeModel } from '../models/Episode';
import { UserLikeModel } from '../models/UserLike';
import { logger } from '../lib/logger';

// Base URL for share links (set FRONTEND_URL in .env)
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://aapki-website.com').replace(/\/$/, '');

// Helper: try to extract userId from JWT (optional auth — no error if missing/invalid)
const getOptionalUserId = (request: FastifyRequest): string | null => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const server = request.server as any;
    const decoded = server.jwt.verify(token) as any;
    return decoded?.id || null;
  } catch {
    return null;
  }
};

// Helper function to map content items for the explore / short-drama reel feed
const mapContentItem = (
  item: any,
  type: string,
  episodeCount = 0,
  firstEpisode?: any,
  likeCount = 0,
  isLikedByUser = false,
) => ({
  id: item._id.toString(),
  title: item.title,
  description: item.description,
  shortDescription: item.shortDescription,
  thumbnail: item.thumbnail,
  bannerImage: item.bannerImage,
  type,
  episodeCount,
  genres: item.genres,
  genresText: item.genres.join(' & '), // For subtitle (like "Romance & Drama")
  languages: item.languages,
  views: item.views || 0,
  // Like fields
  likeCount,
  isLikedByUser,
  shares: item.shares || 0,
  // Share URL — slug-based deep link (human-readable, WhatsApp/social ready)
  // Priority: slug → auto-slug from title → id fallback
  shareUrl: (() => {
    const slug =
      item.slug ||
      (item.title
        ? item.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
            .replace(/\s+/g, '-')            // spaces → hyphens
            .replace(/-+/g, '-')             // collapse multiple hyphens
        : null);
    return slug
      ? `${FRONTEND_URL}/watch/${slug}`
      : `${FRONTEND_URL}/watch/${item._id.toString()}`;
  })(),
  featured: item.featured,
  trending: item.trending,
  isNewContent: item.isNewContent,
  rating: item.rating,
  year: item.year,
  duration: item.duration,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  // Preview video info — only first episode (short-drama reel style)
  videoUrl: firstEpisode?.hlsUrl || item.hlsUrl || null,
  trailerUrl: firstEpisode?.trailerUrl || item.trailerUrl || null,
  firstEpisodeId: firstEpisode?._id?.toString() || null,
  firstEpisodeTitle: firstEpisode?.title || null,
  firstEpisodeThumbnail: firstEpisode?.thumbnail || null,
  firstEpisodeDuration: firstEpisode?.duration || null,
  firstEpisodeIsFree: firstEpisode?.isFree ?? null,
});

// Get explore page data (infinite scroll, short-drama reel style)
export const getExplore = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as {
      offset?: string;
      limit?: string;
      sort?: 'new' | 'trending' | 'views' | 'featured';
      contentType?: 'drama' | 'movie';
    };

    const offset = Math.max(0, Number(query.offset || 0));
    const limit = Math.min(10, Math.max(1, Number(query.limit || 1)));
    const sort = query.sort || 'new';
    const contentType = query.contentType || 'drama';

    // Optional auth — used for isLikedByUser
    const userId = getOptionalUserId(request);

    let sortBy = {};
    let filter: any = { status: 'published' };

    // Add contentType filter for dramas
    if (contentType === 'drama') {
      filter.contentType = 'drama';
    }

    // Determine sorting
    switch (sort) {
      case 'new':
        sortBy = { createdAt: -1 };
        break;
      case 'trending':
        sortBy = { trending: -1, views: -1 };
        break;
      case 'views':
        sortBy = { views: -1 };
        break;
      case 'featured':
        sortBy = { featured: -1, views: -1 };
        filter = { ...filter, featured: true };
        break;
      default:
        sortBy = { createdAt: -1 };
    }

    const skip = offset;

    // Fetch data based on contentType
    let contents: any[] = [];
    let contentModelType: 'Content' | 'Movie' = 'Content';

    if (contentType === 'movie') {
      contentModelType = 'Movie';
      contents = await MovieModel.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean();
    } else {
      contentModelType = 'Content';
      contents = await ContentModel.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    logger.info({ contentType, filter, sortBy, offset, limit, contentsLength: contents.length }, 'Explore API query results');

    const contentIds = contents.map(c => c._id);

    // --- First episode only (for short-drama preview) ---
    let firstEpisodeMap = new Map<string, any>();
    let episodeCountMap = new Map<string, number>();

    if (contentType === 'drama') {
      // Fetch ONLY season 1 ep 1 (the preview episode) per content
      const firstEpisodes = await EpisodeModel.aggregate([
        {
          $match: {
            contentId: { $in: contentIds },
            season: 1,
            episode: 1,
            processingStatus: 'ready',
          },
        },
        { $sort: { season: 1, episode: 1 } },
      ]);

      firstEpisodes.forEach(e => {
        firstEpisodeMap.set(e.contentId.toString(), e);
      });

      // Get episode counts (total ep count displayed in UI)
      const episodeCounts = await EpisodeModel.aggregate([
        { $match: { contentId: { $in: contentIds } } },
        { $group: { _id: '$contentId', count: { $sum: 1 } } },
      ]);

      episodeCounts.forEach(e => {
        episodeCountMap.set(e._id.toString(), e.count);
      });
    }

    // --- isLikedByUser ---
    const likedContentIdSet = new Set<string>();
    if (userId && contentIds.length > 0) {
      const userLikes = await UserLikeModel.find({
        userId,
        contentId: { $in: contentIds },
      })
        .select('contentId')
        .lean();
      userLikes.forEach(l => likedContentIdSet.add(l.contentId.toString()));
    }

    // Map the data
    const items = contents.map(content => {
      const cid = content._id.toString();
      const likeCount: number = content.likes || 0;
      const isLikedByUser: boolean = likedContentIdSet.has(cid);

      if (contentType === 'movie') {
        return mapContentItem(content, 'movie', 0, undefined, likeCount, isLikedByUser);
      } else {
        const episodeCount = episodeCountMap.get(cid) || 0;
        const firstEpisode = firstEpisodeMap.get(cid); // only episode 1 preview
        return mapContentItem(content, content.type || 'series', episodeCount, firstEpisode, likeCount, isLikedByUser);
      }
    });

    reply.send({
      success: true,
      data: {
        items,
        nextOffset: offset + items.length,
        hasMore: items.length === limit,
      },
    });
  } catch (error: any) {
    logger.error(error, 'Error fetching explore data');
    reply.status(500).send({
      success: false,
      message: 'Failed to fetch explore data',
      error: error.message
    });
  }
};
