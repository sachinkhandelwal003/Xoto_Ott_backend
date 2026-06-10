import type { FastifyRequest, FastifyReply } from 'fastify';
import { MediaFolderModel } from '../models/MediaFolder';
import { MediaFileModel } from '../models/MediaFile';
import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../lib/logger';
import uploadHandler from '../lib/uploadHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../../uploads');
const mediaUploadDir = path.join(uploadsRoot, 'media');

// Utility functions
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Seed default folders
export const seedDefaultFolders = async () => {
  const defaultFolderNames = [
    'Ads',
    'Banner',
    'Cast & Crew',
    'Constant',
    'Genres',
    'Logos',
    'Short Drama',
    'Users',
    'Video',
  ];

  for (const name of defaultFolderNames) {
    const existing = await MediaFolderModel.findOne({ name });
    if (!existing) {
      await MediaFolderModel.create({ name });
    }
  }
};

// Get all folders
export const getFolders = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const folders = await MediaFolderModel.find().sort({ name: 1 }).lean();
    const foldersWithCount = [];
    for (const folder of folders) {
      const count = await MediaFileModel.countDocuments({ folder: folder._id });
      foldersWithCount.push({
        _id: folder._id,
        name: folder.name,
        count,
      });
    }

    return reply.send({
      success: true,
      data: foldersWithCount,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting folders');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Create folder
export const createFolder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name } = request.body as { name: string };
    if (!name) {
      return reply.status(400).send({ success: false, error: 'Folder name is required' });
    }

    const existing = await MediaFolderModel.findOne({ name });
    if (existing) {
      return reply.status(400).send({ success: false, error: 'Folder already exists' });
    }

    const folder = await MediaFolderModel.create({ name });
    return reply.status(201).send({
      success: true,
      data: folder,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating folder');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Delete folder
export const deleteFolder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid folder ID' });
    }

    const folder = await MediaFolderModel.findById(id);
    if (!folder) {
      return reply.status(404).send({ success: false, error: 'Folder not found' });
    }

    const files = await MediaFileModel.find({ folder: id });

    // Delete files from disk
    for (const file of files) {
      uploadHandler.deleteUploadedFile(file.filePath);
    }

    // Delete files from DB
    await MediaFileModel.deleteMany({ folder: id });

    // Delete folder from DB
    await MediaFolderModel.findByIdAndDelete(id);

    // Delete folder from disk
    const folderPath = path.join(mediaUploadDir, id);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    return reply.send({ success: true, message: 'Folder deleted successfully' });
  } catch (error: any) {
    logger.error({ error }, 'Error deleting folder');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Get files by folder
export const getFilesByFolder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid folder ID' });
    }

    const folder = await MediaFolderModel.findById(id);
    if (!folder) {
      return reply.status(404).send({ success: false, error: 'Folder not found' });
    }

    const files = await MediaFileModel.find({ folder: id }).sort({ createdAt: -1 }).lean();
    const filesWithSize = files.map((file) => ({
      _id: file._id,
      id: file._id.toString(),
      name: file.name,
      url: file.url,
      filePath: file.filePath,
      size: uploadHandler.formatFileSize(file.fileSize),
      fileSize: file.fileSize,
      folder: id,
    }));

    return reply.send({
      success: true,
      data: filesWithSize,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting files');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Upload file to folder
export const uploadFilesToFolder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid folder ID' });
    }

    const folder = await MediaFolderModel.findById(id);
    if (!folder) {
      return reply.status(404).send({ success: false, error: 'Folder not found' });
    }

    const savedFiles = [];
    const customDir = `media/${id}`;

    for await (const part of request.parts()) {
      if (part.type === 'file' && part.fieldname === 'file') {
        const uploadedFile = await uploadHandler.saveFileFromPart(part, request, 'MEDIA_LIBRARY', customDir);
        const mediaFile = await MediaFileModel.create({
          name: uploadedFile.originalName,
          url: uploadedFile.url,
          filePath: uploadedFile.filePath,
          fileSize: uploadedFile.fileSize,
          fileType: uploadedFile.mimeType,
          folder: new Types.ObjectId(id),
        });
        savedFiles.push(mediaFile);
      }
    }

    return reply.status(201).send({
      success: true,
      data: savedFiles,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error uploading files');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Delete file
export const deleteFile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid file ID' });
    }

    const file = await MediaFileModel.findById(id);
    if (!file) {
      return reply.status(404).send({ success: false, error: 'File not found' });
    }

    // Delete file from disk
    uploadHandler.deleteUploadedFile(file.filePath);

    // Delete from DB
    await MediaFileModel.findByIdAndDelete(id);

    return reply.send({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    logger.error({ error }, 'Error deleting file');
    return reply.status(500).send({ success: false, error: error.message });
  }
};
