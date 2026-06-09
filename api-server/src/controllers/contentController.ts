import type { FastifyReply, FastifyRequest } from 'fastify';
import { ContentModel } from '../models/Content';
import { CategoryModel } from '../models/Category';
import { EpisodeModel } from '../models/Episode';
import { Types } from 'mongoose';
import fs from 'fs';
import { 
  ensureDefaultImage, 
  parseBool, 
  parseList, 
  parsePositiveNumber, 
  processEpisodesInBackground, 
  toLocalUploadPath, 
  getVideoDurationSeconds, 
  readCategoryMultipart, 
  createEpisodeSlices, 
  mapContent, 
  mapEpisode, 
  mapCategory 
} from './categoryController';

export const createContent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await readCategoryMultipart(request);
    const reelDurationMinutes = data.reelDurationMinutes || 3;
    const categoryIds = data.categoryIds || [];

    if (!data.title || !data.videoUrl || categoryIds.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'title, categories, and videoFile/videoUrl are required',
      });
    }

    // Validate all category IDs exist
    const categories = await CategoryModel.find({ _id: { $in: categoryIds } }).lean();
    if (categories.length !== categoryIds.length) {
      return reply.status(404).send({ success: false, message: 'One or more categories not found' });
    }

    const categoryObjectIds = categories.map(cat => new Types.ObjectId(cat._id));
    const thumbnail = data.thumbnail || ensureDefaultImage();

    const sourceVideoPath = toLocalUploadPath(data.videoUrl);
    if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
      return reply.status(400).send({
        success: false,
        message: 'Episode splitting requires a locally uploaded videoFile.',
      });
    }

    const content = await ContentModel.create({
      title: data.title,
      type: 'series',
      description: data.description,
      shortDescription: data.subtitle,
      thumbnail,
      bannerImage: thumbnail,
      genres: data.genres || [],
      languages: data.languages && data.languages.length ? data.languages : ['English'],
      categories: categoryObjectIds,
      status: 'processing',
      featured: true,
      isNewContent: true,
      planRequired: 'free',
      seasons: 1,
    });

    const episodes = await createEpisodeSlices({
      contentId: content._id as Types.ObjectId,
      sourceVideoUrl: data.videoUrl,
      sourceVideoPath,
      reelDurationMinutes,
      totalDurationMinutes: data.totalDurationMinutes,
      freeEpisodeCount: Number.isFinite(data.freeEpisodeCount) ? data.freeEpisodeCount! : 1,
      lockEpisodes: data.lockEpisodes ?? true,
      thumbnail,
      title: data.title,
      heading: data.subtitle,
      categories: categoryObjectIds,
    });

    return reply.status(201).send({
      success: true,
      data: {
        categories: categories.map(mapCategory),
        content: mapContent(content.toObject(), episodes.length),
        episodes: episodes.map(mapEpisode),
      },
      message: 'Content created. HLS generation has started in the background.',
    });
  } catch (error: any) {
    console.error('Error creating content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const listContent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      type?: string;
      status?: string;
    };
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.type) {
      filter.type = query.type;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const [contents, total] = await Promise.all([
      ContentModel.find(filter)
        .populate('categories')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContentModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Error listing content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const searchContent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as {
      q?: string;
      page?: string;
      limit?: string;
    };
    const searchQuery = query.q || '';
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter: any = { status: 'published' };
    
    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } },
      ];
    }

    const [contents, total] = await Promise.all([
      ContentModel.find(filter)
        .populate('categories')
        .sort({ views: -1, trending: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContentModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Error searching content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getRandomShows = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as {
      limit?: string;
    };
    const limit = Math.min(50, Math.max(1, Number(query.limit || 10)));
    
    const contents = await ContentModel.aggregate([
      { $match: { status: 'published' } },
      { $sample: { size: limit } },
    ]);

    await ContentModel.populate(contents, { path: 'categories' });

    return {
      success: true,
      data: contents,
    };
  } catch (error: any) {
    console.error('Error getting random shows:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getContentById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const content = await ContentModel.findById(id).populate('categories').lean();

    if (!content) {
      return reply.status(404).send({ success: false, message: 'Content not found' });
    }

    const episodes = await EpisodeModel.find({ contentId: new Types.ObjectId(id) }).sort({ season: 1, episode: 1 }).lean();

    return {
      success: true,
      data: {
        content,
        categories: content.categories.map(mapCategory),
        episodes: episodes.map(mapEpisode)
      }
    };
  } catch (error: any) {
    console.error('Error getting content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateContent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.genres !== undefined) updateData.genres = body.genres;
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
    if (body.bannerImage !== undefined) updateData.bannerImage = body.bannerImage;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.trending !== undefined) updateData.trending = body.trending;
    if (body.planRequired !== undefined) updateData.planRequired = body.planRequired;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.categories !== undefined) updateData.categories = body.categories;

    const updatedContent = await ContentModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('categories');

    return {
      success: true,
      data: updatedContent,
      message: 'Content updated successfully'
    };
  } catch (error: any) {
    console.error('Error updating content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteContent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };

    const content = await ContentModel.findById(id);
    if (!content) {
      return reply.status(404).send({ success: false, message: 'Content not found' });
    }

    await ContentModel.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Content deleted successfully'
    };
  } catch (error: any) {
    console.error('Error deleting content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const appendContentVideo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const content = await ContentModel.findById(id);

    if (!content) {
      return reply.status(404).send({ success: false, message: 'Content not found' });
    }

    const data = await readCategoryMultipart(request);
    const reelDurationMinutes = data.reelDurationMinutes || 3;

    if (!data.videoUrl) {
      return reply.status(400).send({ success: false, message: 'videoFile is required' });
    }

    const sourceVideoPath = toLocalUploadPath(data.videoUrl);
    if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
      return reply.status(400).send({
        success: false,
        message: 'Episode splitting requires a locally uploaded videoFile.',
      });
    }

    const episodes = await createEpisodeSlices({
      contentId: content._id as Types.ObjectId,
      sourceVideoUrl: data.videoUrl,
      sourceVideoPath,
      reelDurationMinutes,
      totalDurationMinutes: data.totalDurationMinutes,
      freeEpisodeCount: Number.isFinite(data.freeEpisodeCount) ? data.freeEpisodeCount! : 1,
      lockEpisodes: data.lockEpisodes ?? true,
      thumbnail: data.thumbnail || content.thumbnail,
      title: content.title,
      heading: content.shortDescription,
      categories: content.categories,
    });

    return reply.status(201).send({
      success: true,
      data: {
        contentId: content._id.toString(),
        addedEpisodes: episodes.length,
        episodes: episodes.map(mapEpisode),
      },
      message: 'New episodes added. HLS generation has started in the background.',
    });
  } catch (error: any) {
    console.error('Error appending show video:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateContentEpisodeLock = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { episodeId } = request.params as { episodeId: string };
    const { isLocked } = request.body as { isLocked: boolean };

    const episode = await EpisodeModel.findById(episodeId);
    if (!episode) {
      return reply.status(404).send({ success: false, message: 'Episode not found' });
    }

    episode.isLocked = isLocked;
    episode.isFree = !isLocked || episode.isFree; // if unlocking, set isFree to true
    await episode.save();

    return { success: true, message: 'Episode lock status updated' };
  } catch (error: any) {
    console.error('Error updating episode lock:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};
