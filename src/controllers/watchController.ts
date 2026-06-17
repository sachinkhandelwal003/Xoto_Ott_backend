import type { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';
import { ContentModel } from '../models/Content';
import { EpisodeModel } from '../models/Episode';
import { UserLikeModel } from '../models/UserLike';
import { UserModel } from '../models/User';
import { logger } from '../lib/logger';

// Plan hierarchy — higher index = higher plan
const PLAN_LEVELS: Record<string, number> = {
  free: 0,
  basic: 1,
  standard: 2,
  premium: 3,
};

// Base URL for the backend API (used for smart share links)
const API_URL = (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

// Helper: generate smart share URL pointing to backend redirect endpoint
const buildShareUrl = (item: any): string => {
  return `${API_URL}/share/${item._id.toString()}`;
};

// Helper: optional JWT extraction (no error if missing)
const getOptionalUser = async (request: FastifyRequest): Promise<{ userId: string; userPlan: string } | null> => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const server = request.server as any;
    const decoded = server.jwt.verify(authHeader.slice(7)) as any;
    if (!decoded?.id) return null;

    // Get user's current subscription plan
    const user = await UserModel.findById(decoded.id).select('subscriptionPlan subscriptionStatus subscriptionExpiry').lean();
    if (!user) return null;

    // Check if subscription is still active
    const isActive =
      user.subscriptionStatus === 'active' &&
      (!user.subscriptionExpiry || user.subscriptionExpiry > new Date());

    const userPlan = isActive ? (user.subscriptionPlan || 'free') : 'free';
    return { userId: decoded.id, userPlan };
  } catch {
    return null;
  }
};

// Helper: determine if an episode is accessible to the user
const canAccessEpisode = (
  episode: any,
  contentPlanRequired: string,
  userPlan: string,
): boolean => {
  // Free episodes are always accessible
  if (episode.isFree) return true;
  // Episode explicitly locked
  if (episode.isLocked) {
    const userLevel = PLAN_LEVELS[userPlan] ?? 0;
    const requiredLevel = PLAN_LEVELS[contentPlanRequired] ?? 0;
    return userLevel >= requiredLevel;
  }
  return true;
};

// GET /api/watch/:contentId?season=1&episode=1
export const getWatchData = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { contentId } = request.params as { contentId: string };
    const query = request.query as {
      season?: string;
      episode?: string;
    };

    const requestedSeason = Math.max(1, Number(query.season || 1));
    const requestedEpisode = Math.max(1, Number(query.episode || 1));

    // Validate contentId
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return reply.status(400).send({ success: false, message: 'Invalid contentId.' });
    }

    // ── 1. Get user info (optional) ──────────────────────────────────────────
    const userInfo = await getOptionalUser(request);
    const userId = userInfo?.userId || null;
    const userPlan = userInfo?.userPlan || 'free';

    // ── 2. Get Content ────────────────────────────────────────────────────────
    const content = await ContentModel.findById(contentId).lean();
    if (!content || content.status !== 'published') {
      return reply.status(404).send({ success: false, message: 'Content not found.' });
    }

    // ── 3. Get all episodes grouped by season ────────────────────────────────
    const allEpisodes = await EpisodeModel.find({ contentId: content._id })
      .sort({ season: 1, episode: 1 })
      .lean();

    // Group into seasons
    const seasonMap = new Map<number, any[]>();
    allEpisodes.forEach(ep => {
      if (!seasonMap.has(ep.season)) seasonMap.set(ep.season, []);
      seasonMap.get(ep.season)!.push(ep);
    });

    const totalEpisodes = allEpisodes.length;
    const totalSeasons = seasonMap.size;

    // ── 4. Resolve current episode ────────────────────────────────────────────
    const currentEpisodeRaw = allEpisodes.find(
      ep => ep.season === requestedSeason && ep.episode === requestedEpisode,
    ) || allEpisodes[0]; // fallback to ep1

    const currentEpisodeAccessible = currentEpisodeRaw
      ? canAccessEpisode(currentEpisodeRaw, content.planRequired, userPlan)
      : false;

    // ── 5. Build video quality options for current episode ────────────────────
    // Use content-level videoQualities or derive from HLS URL
    const buildVideoSettings = (ep: any) => {
      const autoUrl = ep?.hlsUrl || null;

      // Content may have videoQualities array (144p, 360p, 480p, 720p, 1080p)
      const qualities = (content as any).videoQualities || [];
      const bestUrl =
        qualities.find((q: any) => q.quality === '1080p')?.url ||
        qualities.find((q: any) => q.quality === '720p')?.url ||
        autoUrl;
      const dataSaverUrl =
        qualities.find((q: any) => q.quality === '360p')?.url ||
        qualities.find((q: any) => q.quality === '144p')?.url ||
        autoUrl;

      return [
        {
          key: 'auto',
          label: 'Auto (Recommended)',
          description: 'Adjusts the video quality to give you the best experience for your conditions',
          url: autoUrl,
        },
        {
          key: 'best',
          label: 'Best Quality',
          description: 'Best watching experience, uses more data',
          url: bestUrl,
        },
        {
          key: 'dataSaver',
          label: 'Data Saver',
          description: 'Lower video quality, saves data',
          url: dataSaverUrl,
        },
      ];
    };

    // ── 6. Map current episode (hide hlsUrl if locked) ───────────────────────
    const mapEpisode = (ep: any, contentPlan: string, plan: string) => {
      const accessible = canAccessEpisode(ep, contentPlan, plan);
      return {
        id: ep._id.toString(),
        season: ep.season,
        episodeNumber: ep.episode,
        title: ep.title,
        description: ep.description || null,
        thumbnail: ep.thumbnail || null,
        duration: ep.duration || null,
        airDate: ep.airDate || null,
        isFree: ep.isFree,
        isLocked: !accessible,           // 🔒 locked if user can't access
        hlsUrl: accessible ? ep.hlsUrl || null : null,   // hidden if locked
        trailerUrl: ep.trailerUrl || null,
        subtitleLanguages: ep.subtitleLanguages || [],
        audioLanguages: ep.audioLanguages || [],
        processingStatus: ep.processingStatus,
      };
    };

    // ── 7. Build seasons array ────────────────────────────────────────────────
    const seasons = Array.from(seasonMap.entries()).map(([seasonNum, episodes]) => ({
      seasonNumber: seasonNum,
      totalEpisodes: episodes.length,
      episodes: episodes.map(ep => mapEpisode(ep, content.planRequired, userPlan)),
    }));

    // ── 8. isLikedByUser ──────────────────────────────────────────────────────
    let isLikedByUser = false;
    if (userId) {
      const liked = await UserLikeModel.findOne({ userId, contentId: content._id }).lean();
      isLikedByUser = !!liked;
    }

    // ── 9. Current episode full detail ────────────────────────────────────────
    const currentEpisode = currentEpisodeRaw
      ? {
          ...mapEpisode(currentEpisodeRaw, content.planRequired, userPlan),
          // Video quality settings (only if accessible)
          videoSettings: currentEpisodeAccessible
            ? buildVideoSettings(currentEpisodeRaw)
            : null,
        }
      : null;

    // ── 10. Build response ────────────────────────────────────────────────────
    return reply.send({
      success: true,
      data: {
        // ── Content Info ──
        content: {
          id: content._id.toString(),
          title: content.title,
          description: content.description || null,
          shortDescription: content.shortDescription || null,
          thumbnail: content.thumbnail || null,
          bannerImage: content.bannerImage || null,
          genres: content.genres || [],
          genresText: (content.genres || []).join(' & '),
          languages: content.languages || [],
          totalSeasons,
          totalEpisodes,
          // e.g. "1 of 3 Episodes • Season 1 • Romance"
          episodeMeta: `${requestedEpisode} of ${totalEpisodes} Episodes • Season ${requestedSeason} • ${(content.genres || []).join(', ')}`,
          year: content.year || null,
          rating: content.rating || null,
          ageRating: content.ageRating || 0,
          planRequired: content.planRequired,
          isExclusive: content.isExclusive || false,
          featured: content.featured || false,
          trending: content.trending || false,
          views: content.views || 0,
          likeCount: content.likes || 0,
          isLikedByUser,
          shareUrl: buildShareUrl(content),
        },

        // ── Current Playing Episode ──
        currentEpisode,

        // ── All Seasons + Episodes (with lock/unlock) ──
        seasons,

        // ── User Access Info ──
        userAccess: {
          isLoggedIn: !!userId,
          userPlan,
          canAccessCurrentEpisode: currentEpisodeAccessible,
        },
      },
    });
  } catch (error: any) {
    logger.error(error, 'Error fetching watch data');
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch watch data.',
      error: error.message,
    });
  }
};
