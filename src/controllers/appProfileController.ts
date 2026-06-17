import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserModel } from '../models/User';
import { ContentModel } from '../models/Content';
import { PageModel } from '../models/Page';
import { logger } from '../lib/logger';

// Optional user lookup helper
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

// ── GET Profile & Settings ──────────────────────────────────────────────────
export const getAppProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getOptionalUserId(request);
    
    // 1. Fetch User
    let userProfile = null;
    if (userId) {
      const user = await UserModel.findById(userId).lean();
      if (user) {
        const isActive = user.subscriptionStatus === 'active' && (!user.subscriptionExpiry || user.subscriptionExpiry > new Date());
        userProfile = {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone || null,
          email: user.email || null,
          subscriptionStatus: isActive ? 'active' : 'inactive',
          subscriptionPlan: isActive ? (user.subscriptionPlan || 'free') : 'free',
          videoQuality: user.videoQuality || 'auto',
        };
      }
    } else {
      userProfile = {
        id: null,
        name: 'Guest',
        subscriptionStatus: 'inactive',
        subscriptionPlan: 'free',
        videoQuality: 'auto',
      };
    }

    // 2. Trial Offer Banner Data
    const subscriptionOffer = {
      title: 'Trial Offer',
      subtitle: 'View benefits below',
      ctaText: 'Start Trial',
      benefits: [
        { icon: 'unlimited', title: 'Unlimited Access' },
        { icon: 'ads', title: 'Ads Free' },
        { icon: 'hd', title: 'HD Quality' },
        { icon: 'devices', title: 'Multiple Logins' },
      ],
    };

    // 3. Recommendations ("Dramas you might like")
    const recommendationsRaw = await ContentModel.find({
      status: 'published',
      type: 'series',
      contentType: 'drama'
    })
      .sort({ views: -1 })
      .limit(3)
      .lean();

    const recommendations = recommendationsRaw.map(r => ({
      id: r._id.toString(),
      title: r.title,
      thumbnail: r.thumbnail,
      views: r.views || 0,
      type: 'drama'
    }));

    // 4. App Links / Pages
    // Try to find Pages in DB, else use fallback
    const pages = await PageModel.find({ status: 'published' }).lean();
    const getPageSlug = (slug: string) => pages.find(p => p.slug === slug)?._id?.toString() || null;

    const appSettings = {
      videoPlayerSettingsTitle: 'Video player settings',
      shareAppTitle: 'Share the App',
      shareAppText: 'Watch amazing short dramas and movies on Xoto OTT!',
      shareAppUrl: 'https://play.google.com/store/apps/details?id=com.xoto.ott',
      links: [
        { title: 'Privacy Policy', url: getPageSlug('privacy-policy') ? `/pages/privacy-policy` : 'https://xoto.com/privacy' },
        { title: 'Terms & Conditions', url: getPageSlug('terms-conditions') ? `/pages/terms-conditions` : 'https://xoto.com/terms' },
        { title: 'Contact Us', url: 'mailto:support@xoto.com' },
      ],
      appVersion: 'V1.2.4',
    };

    return reply.send({
      success: true,
      data: {
        user: userProfile,
        subscriptionOffer,
        recommendations,
        appSettings,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting app profile');
    return reply.status(500).send({ success: false, message: 'Failed to fetch profile' });
  }
};

// ── PUT Video Quality Setting ───────────────────────────────────────────────
export const updateVideoQuality = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getOptionalUserId(request);
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { videoQuality } = request.body as { videoQuality: 'auto' | 'best' | 'data_saver' };
    
    if (!['auto', 'best', 'data_saver'].includes(videoQuality)) {
      return reply.status(400).send({ success: false, message: 'Invalid video quality setting' });
    }

    await UserModel.findByIdAndUpdate(userId, { videoQuality });

    return reply.send({
      success: true,
      message: 'Video quality setting updated successfully',
      data: { videoQuality }
    });
  } catch (error: any) {
    logger.error({ error }, 'Error updating video quality');
    return reply.status(500).send({ success: false, message: 'Failed to update setting' });
  }
};
