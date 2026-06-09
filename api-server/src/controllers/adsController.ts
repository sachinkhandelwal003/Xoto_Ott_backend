
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AdModel } from '../models/Ad';

export const createAd = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;
    const ad = await AdModel.create(body);
    return {
      success: true,
      data: ad,
      message: "Ad created successfully"
    };
  } catch (error: any) {
    console.error('Error creating ad:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getAdById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const ad = await AdModel.findById(id).lean();

    if (!ad) {
      return reply.status(404).send({ success: false, message: 'Ad not found' });
    }

    return { success: true, data: ad };
  } catch (error: any) {
    console.error('Error getting ad:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const listActiveAds = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { admin } = request.query as any;
    const query = request.query as {
      type?: string;
      platform?: string;
    };

    const filter: any = admin ? {} : { isActive: true };
    
    if (!admin) {
      const now = new Date();
      filter.$and = [
        { $or: [{ startDate: { $lte: now } }, { startDate: { $exists: false } }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: { $exists: false } }] },
      ];
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.platform) {
      filter.targetPlatforms = query.platform;
    }

    const ads = await AdModel.find(filter).sort({ priority: -1, createdAt: -1 }).lean();

    return {
      success: true,
      data: ads };
  } catch (error: any) {
    console.error('Error listing ads:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateAd = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const ad = await AdModel.findByIdAndUpdate(id, { $set: body }, { new: true });
    return { success: true, data: ad, message: 'Ad updated successfully' };
  } catch (error: any) {
    console.error('Error updating ad:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteAd = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    await AdModel.findByIdAndDelete(id);
    return { success: true, message: 'Ad deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting ad:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const trackAdView = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    await AdModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return { success: true, message: 'Ad view tracked' };
  } catch (error: any) {
    console.error('Error tracking ad view:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const trackAdClick = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    await AdModel.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
    return { success: true, message: 'Ad click tracked' };
  } catch (error: any) {
    console.error('Error tracking ad click:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

