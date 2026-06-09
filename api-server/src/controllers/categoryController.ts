import type { FastifyReply, FastifyRequest } from 'fastify';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Types } from 'mongoose';
import { CategoryModel } from '../models/Category';
import { ContentModel } from '../models/Content';
import { EpisodeModel } from '../models/Episode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../../uploads');

type CategoryMultipartData = {
  name?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  bannerImage?: string;
  icon?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  title?: string;
  subtitle?: string;
  genres?: string[];
  languages?: string[];
  categoryId?: string;
  categoryIds?: string[];
  reelDurationMinutes?: number;
  totalDurationMinutes?: number;
  freeEpisodeCount?: number;
  lockEpisodes?: boolean;
  videoUrl?: string;
};

export const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).filter(item => item.toLowerCase() !== 'skip');
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(item => item.toLowerCase() !== 'skip');
};

export const parseBool = (value: unknown, fallback = false): boolean => {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true' || value === '1' || value === 'yes';
};

export const parseDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const parsePositiveNumber = (value: unknown, fallback?: number): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const ensureDefaultImage = () => {
  const folder = path.join(uploadsRoot, 'categories');
  const fileName = 'default-category.svg';
  const filePath = path.join(folder, fileName);
  ensureDir(folder);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#0b1217"/>
  <rect x="64" y="64" width="1152" height="592" rx="28" fill="#141d23" stroke="#2a343c" stroke-width="4"/>
  <circle cx="640" cy="360" r="92" fill="#e50914"/>
  <text x="640" y="515" text-anchor="middle" fill="#d7dde2" font-family="Arial, sans-serif" font-size="42" font-weight="700">Category</text>
</svg>`
    );
  }

  return '/uploads/categories/' + fileName;
};

export const deleteOldFile = (filePath?: string) => {
  if (!filePath || !filePath.startsWith('/uploads/')) return;
  const fullPath = path.join(__dirname, '../..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

export const saveUploadedFile = async (part: any, folder: string): Promise<string> => {
  ensureDir(path.join(uploadsRoot, folder));
  const uniqueName = Date.now() + '-' + (part.filename || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = path.join(uploadsRoot, folder, uniqueName);

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    part.file.pipe(writeStream);
    writeStream.on('finish', () => resolve('/uploads/' + folder + '/' + uniqueName));
    writeStream.on('error', reject);
  });
};

export const toLocalUploadPath = (fileUrl: string): string | undefined => {
  if (!fileUrl.startsWith('/uploads/')) return undefined;
  return path.join(__dirname, '../..', fileUrl);
};

export const readCategoryMultipart = async (request: FastifyRequest): Promise<CategoryMultipartData> => {
  const data: CategoryMultipartData = {};

  for await (const part of request.parts()) {
    if (part.type === 'field') {
      if (part.fieldname === 'name') data.name = part.value as string;
      if (part.fieldname === 'slug') data.slug = part.value as string;
      if (part.fieldname === 'description') data.description = part.value as string;
      if (part.fieldname === 'icon') data.icon = part.value as string;
      if (part.fieldname === 'color') data.color = part.value as string;
      if (part.fieldname === 'order') data.order = Number(part.value);
      if (part.fieldname === 'isActive') data.isActive = parseBool(part.value, true);
      if (part.fieldname === 'isFeatured') data.isFeatured = parseBool(part.value, false);
      if (part.fieldname === 'thumbnail') data.thumbnail = part.value as string;
      if (part.fieldname === 'bannerImage') data.bannerImage = part.value as string;
      if (part.fieldname === 'title') data.title = part.value as string;
      if (part.fieldname === 'subtitle') data.subtitle = part.value as string;
      if (part.fieldname === 'genres') data.genres = parseList(part.value);
      if (part.fieldname === 'languages') data.languages = parseList(part.value);
      if (part.fieldname === 'categoryId') data.categoryId = part.value as string;
      if (part.fieldname === 'categoryIds') data.categoryIds = parseList(part.value);
      if (part.fieldname === 'reelDurationMinutes') data.reelDurationMinutes = parsePositiveNumber(part.value);
      if (part.fieldname === 'totalDurationMinutes') data.totalDurationMinutes = parsePositiveNumber(part.value);
      if (part.fieldname === 'freeEpisodeCount') data.freeEpisodeCount = Number(part.value);
      if (part.fieldname === 'lockEpisodes') data.lockEpisodes = parseBool(part.value, true);
      if (part.fieldname === 'videoUrl') data.videoUrl = part.value as string;
    } else if (part.type === 'file') {
      if (part.fieldname === 'thumbnailFile') data.thumbnail = await saveUploadedFile(part, 'thumbnails');
      if (part.fieldname === 'bannerFile') data.bannerImage = await saveUploadedFile(part, 'thumbnails');
      if (part.fieldname === 'videoFile') data.videoUrl = await saveUploadedFile(part, 'videos');
    }
  }

  return data;
};

const runCommand = (command: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || command + ' exited with code ' + code));
      }
    });
  });
};

export const getVideoDurationSeconds = async (filePath: string): Promise<number | undefined> => {
  try {
    const output = await runCommand('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const duration = Number(output);
    return Number.isFinite(duration) && duration > 0 ? duration : undefined;
  } catch (error) {
    console.warn('ffprobe unavailable or failed:', error);
    return undefined;
  }
};

export const mapContent = (content: any, episodeCount = 0) => ({
  _id: content._id.toString(),
  id: content._id.toString(),
  title: content.title,
  subtitle: content.shortDescription,
  description: content.description,
  thumbnail: content.thumbnail,
  bannerImage: content.bannerImage,
  genres: content.genres,
  languages: content.languages,
  views: content.views,
  likes: content.likes,
  shares: content.shares,
  episodeCount,
  status: content.status,
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
});

export const mapEpisode = (episode: any) => ({
  id: episode._id.toString(),
  contentId: episode.contentId.toString(),
  episode: episode.episode,
  season: episode.season,
  title: episode.title,
  heading: episode.heading,
  description: episode.description,
  thumbnail: episode.thumbnail,
  hlsUrl: episode.hlsUrl,
  sourceVideoUrl: episode.sourceVideoUrl,
  sourceStartSeconds: episode.sourceStartSeconds,
  sourceEndSeconds: episode.sourceEndSeconds,
  duration: episode.duration,
  views: episode.views,
  downloadAllowed: episode.downloadAllowed,
  subtitleLanguages: episode.subtitleLanguages,
  audioLanguages: episode.audioLanguages,
  airDate: episode.airDate,
  isFree: episode.isFree,
  isLocked: episode.isLocked,
  categories: episode.categories ? episode.categories.map(mapCategory) : [],
  processingStatus: episode.processingStatus,
  processingError: episode.processingError,
});

export const mapCategory = (category: any) => ({
  id: category._id.toString(),
  name: category.name,
  description: category.description,
  active: category.active !== undefined ? category.active : true,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

const processEpisodeHls = async (episodeId: Types.ObjectId, sourceVideoUrl: string) => {
  const episode = await EpisodeModel.findById(episodeId);
  if (!episode) return;

  const sourcePath = toLocalUploadPath(sourceVideoUrl);
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    await EpisodeModel.findByIdAndUpdate(episodeId, {
      processingStatus: 'failed',
      processingError: 'Source video file is not available on local uploads storage.',
    });
    return;
  }

  const hlsFolder = path.join(uploadsRoot, 'hls', episode.contentId.toString(), 'episode-' + episode.episode);
  ensureDir(hlsFolder);
  const playlistPath = path.join(hlsFolder, 'index.m3u8');
  const publicPlaylistUrl = '/uploads/hls/' + episode.contentId.toString() + '/episode-' + episode.episode + '/index.m3u8';

  await EpisodeModel.findByIdAndUpdate(episodeId, { processingStatus: 'processing' });

  try {
    await runCommand('ffmpeg', [
      '-y',
      '-ss',
      String(episode.sourceStartSeconds || 0),
      '-i',
      sourcePath,
      '-t',
      String(episode.duration || 0),
      '-c:v',
      'h264',
      '-c:a',
      'aac',
      '-preset',
      'veryfast',
      '-f',
      'hls',
      '-hls_time',
      '6',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      path.join(hlsFolder, 'segment-%03d.ts'),
      playlistPath,
    ]);

    await EpisodeModel.findByIdAndUpdate(episodeId, {
      hlsUrl: publicPlaylistUrl,
      processingStatus: 'ready',
      processingError: undefined,
    });
  } catch (error: any) {
    await EpisodeModel.findByIdAndUpdate(episodeId, {
      processingStatus: 'failed',
      processingError: error.message,
    });
  }
};

export const processEpisodesInBackground = (episodeIds: Types.ObjectId[], sourceVideoUrl: string) => {
  setImmediate(async () => {
    for (const episodeId of episodeIds) {
      await processEpisodeHls(episodeId, sourceVideoUrl);
    }

    const firstEpisode = await EpisodeModel.findById(episodeIds[0]).lean();
    if (!firstEpisode) return;

    const unfinishedCount = await EpisodeModel.countDocuments({
      contentId: firstEpisode.contentId,
      processingStatus: { $in: ['queued', 'processing'] },
    });
    const failedCount = await EpisodeModel.countDocuments({
      contentId: firstEpisode.contentId,
      processingStatus: 'failed',
    });

    if (unfinishedCount === 0) {
      await ContentModel.findByIdAndUpdate(firstEpisode.contentId, {
        status: failedCount > 0 ? 'processing' : 'published',
      });
    }
  });
};

export const createEpisodeSlices = async ({
  contentId,
  sourceVideoUrl,
  sourceVideoPath,
  reelDurationMinutes,
  totalDurationMinutes,
  freeEpisodeCount,
  lockEpisodes,
  thumbnail,
  title,
  heading,
  categories,
}: {
  contentId: Types.ObjectId;
  sourceVideoUrl: string;
  sourceVideoPath: string;
  reelDurationMinutes: number;
  totalDurationMinutes?: number;
  freeEpisodeCount: number;
  lockEpisodes: boolean;
  thumbnail?: string;
  title: string;
  heading?: string;
  categories?: Types.ObjectId[];
}) => {
  const probedDurationSeconds = await getVideoDurationSeconds(sourceVideoPath);
  const totalDurationSeconds = totalDurationMinutes
    ? Math.round(totalDurationMinutes * 60)
    : probedDurationSeconds;

  if (!totalDurationSeconds) {
    throw new Error('Video duration is required when ffprobe cannot read the uploaded file. Send totalDurationMinutes.');
  }

  const sliceSeconds = Math.round(reelDurationMinutes * 60);
  const existingCount = await EpisodeModel.countDocuments({ contentId });
  const episodeCount = Math.ceil(totalDurationSeconds / sliceSeconds);
  const episodes = [];

  for (let index = 0; index < episodeCount; index += 1) {
    const episodeNumber = existingCount + index + 1;
    const start = index * sliceSeconds;
    const end = Math.min(start + sliceSeconds, totalDurationSeconds);
    const isFree = !lockEpisodes || episodeNumber <= freeEpisodeCount;

    episodes.push({
      contentId,
      season: 1,
      episode: episodeNumber,
      title: title + ' - Episode ' + episodeNumber,
      heading,
      thumbnail,
      sourceVideoUrl,
      sourceStartSeconds: start,
      sourceEndSeconds: end,
      duration: end - start,
      hlsUrl: '',
      isFree,
      isLocked: !isFree,
      categories: categories || [],
      processingStatus: 'queued',
    });
  }

  const createdEpisodes = await EpisodeModel.insertMany(episodes);
  processEpisodesInBackground(
    createdEpisodes.map((episode) => episode._id as Types.ObjectId),
    sourceVideoUrl
  );

  return createdEpisodes;
};

export const listCategories = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));

    const [categories, total] = await Promise.all([
      CategoryModel.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CategoryModel.countDocuments(),
    ]);

    const categoryIds = categories.map((cat) => cat._id);
    const contentCounts = await ContentModel.aggregate([
      { $match: { categories: { $in: categoryIds } } },
      { $unwind: '$categories' },
      { $match: { categories: { $in: categoryIds } } },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(contentCounts.map((item) => [item._id.toString(), item.count]));

    return {
      success: true,
      data: categories.map((cat) => ({
        ...mapCategory(cat),
        contentCount: countMap.get(cat._id.toString()) || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Error listing categories:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getCategoriesWithContent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as { limit?: string };
    const contentLimit = Math.min(50, Math.max(1, Number(query.limit || 20)));

    const categories = await CategoryModel.find()
      .sort({ createdAt: -1 })
      .lean();

    const categoryIds = categories.map((cat) => cat._id);

    const contents = await ContentModel.find({
      categories: { $in: categoryIds },
    }).lean();

    const contentIds = contents.map((c) => c._id);
    const counts = await EpisodeModel.aggregate([
      { $match: { contentId: { $in: contentIds } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

    const categoriesWithContent = categories.map((category) => {
      const categoryContents = contents
        .filter((content) => content.categories.some((catId: any) => catId.toString() === category._id.toString()))
        .slice(0, contentLimit)
        .map((content) => mapContent(content, countMap.get(content._id.toString()) || 0));

      return {
        ...mapCategory(category),
        contentCount: categoryContents.length,
        content: categoryContents,
      };
    });

    return {
      success: true,
      data: categoriesWithContent,
    };
  } catch (error: any) {
    console.error('Error getting categories with content:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getCategoryById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { categoryId } = request.params as { categoryId: string };
    const category = await CategoryModel.findById(categoryId).lean();
    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }
    return { success: true, data: mapCategory(category) };
  } catch (error: any) {
    console.error('Error getting category:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getCategoryContents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { categoryId } = request.params as { categoryId: string };
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));

    const category = await CategoryModel.findById(categoryId).lean();
    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    const [contents, total] = await Promise.all([
      ContentModel.find({ categories: category._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContentModel.countDocuments({ categories: category._id }),
    ]);

    const contentIds = contents.map((c) => c._id);
    const counts = await EpisodeModel.aggregate([
      { $match: { contentId: { $in: contentIds } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

    return {
      success: true,
      data: contents.map((c) => mapContent(c, countMap.get(c._id.toString()) || 0)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Error getting category contents:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const createCategory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await readCategoryMultipart(request);

    if (!data.name) {
      return reply.status(400).send({ success: false, message: 'Name is required' });
    }

    const category = await CategoryModel.create({
      name: data.name,
      description: data.description,
      active: data.isActive !== undefined ? data.isActive : true,
    });

    return reply.status(201).send({
      success: true,
      data: mapCategory(category),
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateCategory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { categoryId } = request.params as { categoryId: string };
    const data = await readCategoryMultipart(request);
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.active = data.isActive;

    const category = await CategoryModel.findByIdAndUpdate(
      categoryId,
      { $set: updateData },
      { new: true }
    );

    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    return {
      success: true,
      data: mapCategory(category),
    };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteCategory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { categoryId } = request.params as { categoryId: string };
    const category = await CategoryModel.findByIdAndDelete(categoryId).lean();

    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    await ContentModel.updateMany(
      { categories: category._id },
      { $pull: { categories: category._id } }
    );

    if (category.thumbnail) {
      deleteOldFile(category.thumbnail);
    }
    if (category.bannerImage) {
      deleteOldFile(category.bannerImage);
    }

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const addContentToCategory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { categoryId, contentId } = request.params as { categoryId: string; contentId: string };

    const category = await CategoryModel.findById(categoryId).lean();
    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    const content = await ContentModel.findById(contentId).lean();
    if (!content) {
      return reply.status(404).send({ success: false, message: 'Content not found' });
    }

    await ContentModel.findByIdAndUpdate(contentId, {
      $addToSet: { categories: category._id },
    });

    return { success: true, message: 'Content added to category' };
  } catch (error: any) {
    console.error('Error adding content to category:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const removeContentFromCategory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { categoryId, contentId } = request.params as { categoryId: string; contentId: string };

    const category = await CategoryModel.findById(categoryId).lean();
    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    await ContentModel.findByIdAndUpdate(contentId, {
      $pull: { categories: category._id },
    });

    return { success: true, message: 'Content removed from category' };
  } catch (error: any) {
    console.error('Error removing content from category:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const createCategoryShow = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await readCategoryMultipart(request);
    const reelDurationMinutes = data.reelDurationMinutes || 3;
    const categoryId = data.categoryId;
    const categoryIds = data.categoryIds || (categoryId ? [categoryId] : []);

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

    const categoryObjectIds = categories.map(cat => cat._id);
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
      message: 'Category show created. HLS generation has started in the background.',
    });
  } catch (error: any) {
    console.error('Error creating category show:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const appendCategoryShowVideo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { contentId } = request.params as { contentId: string };
    const content = await ContentModel.findById(contentId);

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
    console.error('Error appending category show video:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getCategoryShow = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { contentId } = request.params as { contentId: string };
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 25)));

    const content = await ContentModel.findById(contentId).lean();
    if (!content) {
      return reply.status(404).send({ success: false, message: 'Content not found' });
    }

    const [episodes, total] = await Promise.all([
      EpisodeModel.find({ contentId })
        .populate('categories')
        .sort({ episode: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EpisodeModel.countDocuments({ contentId }),
    ]);

    return {
      success: true,
      data: {
        content: mapContent(content, total),
        episodeRanges: Array.from({ length: Math.ceil(total / 25) }, (_, index) => ({
          label: `${index * 25 + 1}-${Math.min((index + 1) * 25, total)}`,
          start: index * 25 + 1,
          end: Math.min((index + 1) * 25, total),
        })),
        episodes: episodes.map(mapEpisode),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Error getting category show:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateCategoryEpisodeLock = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { episodeId } = request.params as { episodeId: string };
    const body = request.body as { isLocked?: boolean; isFree?: boolean };
    const isLocked = body.isLocked ?? !body.isFree;
    const episode = await EpisodeModel.findByIdAndUpdate(
      episodeId,
      { isLocked, isFree: !isLocked },
      { new: true }
    ).lean();

    if (!episode) {
      return reply.status(404).send({ success: false, message: 'Episode not found' });
    }

    return { success: true, data: mapEpisode(episode) };
  } catch (error: any) {
    console.error('Error updating episode lock:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};
