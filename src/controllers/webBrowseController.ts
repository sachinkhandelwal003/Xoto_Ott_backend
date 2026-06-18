import type { FastifyReply, FastifyRequest } from 'fastify';
import { MovieModel } from '../models/Movie';
import { ContentModel } from '../models/Content';
import { GenreModel } from '../models/Genre';
import { logger } from '../lib/logger';

// Standardized mapping for website ContentItem
const mapContentItem = (item: any, type: 'movie' | 'show') => {
  let badge;
  if (item.featured && item.trending) badge = 'EXCLUSIVE';
  else if (item.trending) badge = 'TRENDING';
  else if (item.featured) badge = 'TOP';
  else if (item.isNewContent) badge = 'NEW';
  else if (item.views > 1000) badge = 'HOT';

  return {
    id: item._id.toString(),
    title: item.title,
    poster: item.posterImage || item.thumbnail || '',
    backdrop: item.bannerImage || item.thumbnail || '',
    type,
    year: item.year?.toString() || new Date(item.createdAt).getFullYear().toString(),
    duration: item.duration ? `${item.duration}m` : '120m',
    imdbRating: item.imdbRating?.toString() || (item.rating || '8.0'),
    ageRating: item.ageRating ? `${item.ageRating}+` : 'U/A 13+',
    description: item.shortDescription || item.description || '',
    language: item.languages && item.languages.length > 0 ? 'Multi' : 'EN',
    badge,
    genres: (item.genres || []).map((g: any) => g?.name || g),
    seasons: type === 'show' ? item.seasons || 1 : undefined,
  };
};

export const getWebBrowse = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as { type?: string; genre?: string; page?: string; limit?: string };
    const contentType = query.type || 'movie'; // 'movie', 'show', 'drama'
    const genreName = query.genre;
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    let filter: any = { status: 'published' };

    // Handle genre filtering
    if (genreName && genreName.toLowerCase() !== 'all') {
      if (contentType === 'movie') {
        const genre = await GenreModel.findOne({ name: { $regex: new RegExp(`^${genreName}$`, 'i') } }).select('_id').lean();
        if (genre) {
          filter.genres = genre._id;
        } else {
          // Genre not found, return empty
          return reply.send({
            success: true,
            data: { items: [], pagination: { total: 0, page, limit, totalPages: 0 } },
          });
        }
      } else {
        // For show/drama (ContentModel), genres is a string array
        filter.genres = { $regex: new RegExp(`^${genreName}$`, 'i') };
      }
    }

    let Model: any;
    if (contentType === 'movie') {
      Model = MovieModel;
    } else if (contentType === 'show') {
      Model = ContentModel;
      filter.type = 'series';
      filter.contentType = 'series';
    } else if (contentType === 'drama') {
      Model = ContentModel;
      filter.type = 'series';
      filter.contentType = 'drama';
    }

    const selectFields = 'title description shortDescription thumbnail bannerImage posterImage year rating ageRating duration imdbRating featured trending isNewContent views genres languages createdAt';

    const [rawItems, total] = await Promise.all([
      Model.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(selectFields)
        .populate('genres', 'name')
        .lean(),
      Model.countDocuments(filter)
    ]);

    const mappedType = contentType === 'movie' ? 'movie' : 'show';
    const items = rawItems.map((item: any) => mapContentItem(item, mappedType));

    return reply.send({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching web browse API data');
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};
