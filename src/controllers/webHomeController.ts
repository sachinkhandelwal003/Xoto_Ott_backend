import type { FastifyReply, FastifyRequest } from 'fastify';
import { MovieModel } from '../models/Movie';
import { ContentModel } from '../models/Content';
import { EpisodeModel } from '../models/Episode';
import { GenreModel } from '../models/Genre';
import mongoose from 'mongoose';
import { logger } from '../lib/logger';

// Standardized mapping for website ContentItem
const mapContentItem = (item: any, type: 'movie' | 'show', isHero = false) => {
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
    contentType: type === 'movie' ? 'movie' : (item.contentType || 'series'),
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

// Standardized mapping for ShortDrama
const mapShortDrama = (item: any, totalEpisodes: number, freeEpisodes: number) => {
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
    rating: item.imdbRating?.toString() || (item.rating || '8.5'),
    totalEpisodes,
    freeEpisodes,
    language: item.languages && item.languages.length > 0 ? 'Multi' : 'EN',
    badge,
  };
};

export const getWebHome = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Shared projection to make queries extremely fast
    const selectFields = 'title description shortDescription thumbnail bannerImage posterImage year rating ageRating duration imdbRating createdAt featured trending isNewContent views genres languages seasons contentType';

    // Parallel fetching for genres to use in filtering
    const [actionGenre, dramaGenre] = await Promise.all([
      GenreModel.findOne({ name: { $regex: /action/i } }).select('_id').lean(),
      GenreModel.findOne({ name: { $regex: /drama/i } }).select('_id').lean()
    ]);

    // Construct promises for all data blocks to run perfectly in parallel
    const queries = [
      // 0: Hero (Mix of featured movies and shows)
      Promise.all([
        MovieModel.find({ status: 'published', $or: [{ featured: true }, { trending: true }] }).select(selectFields).sort({ createdAt: -1 }).limit(3).populate('genres', 'name').lean(),
        ContentModel.find({ status: 'published', $or: [{ featured: true }, { trending: true }] }).select(selectFields).sort({ createdAt: -1 }).limit(2).populate('genres', 'name').lean()
      ]),
      // 1: Trending Now (Mix)
      Promise.all([
        MovieModel.find({ status: 'published' }).sort({ views: -1, createdAt: -1 }).select(selectFields).limit(5).populate('genres', 'name').lean(),
        ContentModel.find({ status: 'published' }).sort({ views: -1, createdAt: -1 }).select(selectFields).limit(5).populate('genres', 'name').lean()
      ]),
      // 2: New Releases (Mix)
      Promise.all([
        MovieModel.find({ status: 'published' }).sort({ createdAt: -1 }).select(selectFields).limit(5).populate('genres', 'name').lean(),
        ContentModel.find({ status: 'published' }).sort({ createdAt: -1 }).select(selectFields).limit(5).populate('genres', 'name').lean()
      ]),
      // 3: Top Rated Movies
      MovieModel.find({ status: 'published' }).sort({ imdbRating: -1, views: -1 }).select(selectFields).limit(10).populate('genres', 'name').lean(),
      // 4: Featured Dramas (Short Dramas)
      ContentModel.find({ status: 'published', type: 'series', contentType: 'drama', featured: true }).sort({ createdAt: -1 }).select(selectFields).limit(10).populate('genres', 'name').lean(),
      // 5: TV Shows
      ContentModel.find({ status: 'published', type: 'series', contentType: 'series' }).sort({ views: -1 }).select(selectFields).limit(10).populate('genres', 'name').lean(),
      // 6: New Dramas (Short Dramas)
      ContentModel.find({ status: 'published', type: 'series', contentType: 'drama' }).sort({ createdAt: -1 }).select(selectFields).limit(10).populate('genres', 'name').lean(),
      // 7: Action Movies
      actionGenre 
        ? MovieModel.find({ status: 'published', genres: actionGenre._id }).sort({ views: -1 }).select(selectFields).limit(10).populate('genres', 'name').lean() 
        : Promise.resolve([]),
      // 8: Drama Shows
      dramaGenre 
        ? ContentModel.find({ status: 'published', type: 'series', contentType: 'series', genres: dramaGenre._id }).sort({ views: -1 }).select(selectFields).limit(10).populate('genres', 'name').lean() 
        : Promise.resolve([])
    ];

    const results = await Promise.all(queries);

    // Extract results
    const heroRaw = [...results[0][0], ...results[0][1]].sort(() => Math.random() - 0.5);
    const trendingRaw = [...results[1][0], ...results[1][1]].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
    const newReleasesRaw = [...results[2][0], ...results[2][1]].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const topRatedRaw = results[3];
    const featuredDramasRaw = results[4];
    const tvShowsRaw = results[5];
    const newDramasRaw = results[6];
    const actionMoviesRaw = results[7];
    const dramaShowsRaw = results[8];

    // Identify all short dramas to fetch episode counts
    const allShortDramas = [...featuredDramasRaw, ...newDramasRaw];
    const shortDramaIds = allShortDramas.map((d: any) => d._id);

    // Fetch total and free episode counts for short dramas efficiently
    let episodeStatsMap = new Map<string, { total: number, free: number }>();
    if (shortDramaIds.length > 0) {
      const episodeStats = await EpisodeModel.aggregate([
        { $match: { contentId: { $in: shortDramaIds }, processingStatus: 'ready' } },
        { 
          $group: { 
            _id: '$contentId', 
            total: { $sum: 1 }, 
            free: { $sum: { $cond: [{ $eq: ['$isFree', true] }, 1, 0] } } 
          } 
        }
      ]);
      episodeStats.forEach(s => episodeStatsMap.set(s._id.toString(), { total: s.total, free: s.free }));
    }

    // Map raw data into frontend structure
    const heroContent = heroRaw.map((m: any) => mapContentItem(m, m.type === 'series' ? 'show' : 'movie', true));
    const trendingNow = trendingRaw.map((m: any) => mapContentItem(m, m.type === 'series' ? 'show' : 'movie'));
    const newReleases = newReleasesRaw.map((m: any) => mapContentItem(m, m.type === 'series' ? 'show' : 'movie'));
    const topRated = topRatedRaw.map((m: any) => mapContentItem(m, 'movie'));
    const tvShows = tvShowsRaw.map((m: any) => mapContentItem(m, 'show'));
    const actionMovies = actionMoviesRaw.map((m: any) => mapContentItem(m, 'movie'));
    const dramaShows = dramaShowsRaw.map((m: any) => mapContentItem(m, 'show'));

    const featuredDramas = featuredDramasRaw.map((m: any) => {
      const stats = episodeStatsMap.get(m._id.toString()) || { total: 0, free: 0 };
      return mapShortDrama(m, stats.total, stats.free);
    });

    const newDramas = newDramasRaw.map((m: any) => {
      const stats = episodeStatsMap.get(m._id.toString()) || { total: 0, free: 0 };
      return mapShortDrama(m, stats.total, stats.free);
    });

    return reply.send({
      success: true,
      data: {
        heroContent,
        trendingNow,
        newReleases,
        topRated,
        featuredDramas,
        tvShows,
        newDramas,
        actionMovies,
        dramaShows,
      }
    });

  } catch (error: any) {
    logger.error({ error }, 'Error fetching web home API data');
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};
