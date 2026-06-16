import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { FastifyRequest } from 'fastify';
import { MediaFileModel } from '../models/MediaFile';
import { Types } from 'mongoose';
import { uploadToS3, deleteFromS3, isS3Configured } from './s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

export const UPLOAD_TYPES = {
  IMAGE: {
    name: 'image',
    allowedExts: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
    defaultDir: ''
  },
  VIDEO: {
    name: 'video',
    allowedExts: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'],
    defaultDir: 'videos'
  },
  DOCUMENT: {
    name: 'document',
    allowedExts: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    defaultDir: 'documents'
  },
  CATEGORY_THUMBNAIL: {
    name: 'category-thumbnail',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'categories'
  },
  CATEGORY_BANNER: {
    name: 'category-banner',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'categories'
  },
  CATEGORY_ICON: {
    name: 'category-icon',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    defaultDir: 'categories'
  },
  GENRE: {
    name: 'genre',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'genres'
  },
  ACTOR: {
    name: 'actor',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'actors'
  },
  DIRECTOR: {
    name: 'director',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'directors'
  },
  LANGUAGE: {
    name: 'language',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    defaultDir: 'languages'
  },
  MEDIA_LIBRARY: {
    name: 'media-library',
    allowedExts: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov', '.mkv', '.avi', '.flv'],
    defaultDir: 'media'
  },
  BANNER: {
    name: 'banner',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'banners'
  },
  PROMOTION: {
    name: 'promotion',
    allowedExts: ['.jpg', '.jpeg', '.png', '.webp'],
    defaultDir: 'promotions'
  }
} as const;

export type UploadType = keyof typeof UPLOAD_TYPES;

export interface UploadedFileInfo {
  originalName: string;
  fileName: string;
  filePath: string;
  url: string;
  fileSize: number;
  mimeType: string;
  uploadType: UploadType;
  storageType?: 'local' | 's3';
  s3Key?: string;
}

export const ensureUploadDir = (dirPath: string) => {
  const fullPath = path.join(UPLOADS_ROOT, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${timestamp}-${randomString}${baseName ? `-${baseName}` : ''}${ext}`;
};

export const validateFileType = (fileName: string, uploadType: UploadType): boolean => {
  const typeConfig = UPLOAD_TYPES[uploadType];
  const ext = path.extname(fileName).toLowerCase();
  return (typeConfig.allowedExts as readonly string[]).includes(ext);
};

export const saveFileFromPart = async (
  part: any,
  request: FastifyRequest,
  uploadType: UploadType,
  customDir?: string,
  options?: {
    trackInMediaLibrary?: boolean;
    source?: string;
    sourceId?: string;
    folderId?: string;
  }
): Promise<UploadedFileInfo> => {
  const typeConfig = UPLOAD_TYPES[uploadType];
  const targetDir = customDir || typeConfig.defaultDir;
  const useS3 = await isS3Configured();

  if (!validateFileType(part.filename, uploadType)) {
    throw new Error(
      `Invalid file type for ${typeConfig.name}. Allowed types: ${typeConfig.allowedExts.join(', ')}`
    );
  }

  const fileName = generateUniqueFileName(part.filename);
  const s3Key = targetDir ? `${targetDir}/${fileName}` : fileName;

  if (useS3) {
    const chunks: Buffer[] = [];
    for await (const chunk of part.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const publicUrl = await uploadToS3(s3Key, buffer, part.mimetype || 'application/octet-stream');

    const fileInfo: UploadedFileInfo = {
      originalName: part.filename,
      fileName,
      filePath: s3Key,
      url: publicUrl,
      fileSize: buffer.length,
      mimeType: part.mimetype || 'application/octet-stream',
      uploadType,
      storageType: 's3',
      s3Key,
    };

    if (options?.trackInMediaLibrary !== false) {
      try {
        await MediaFileModel.create({
          name: part.filename,
          url: fileInfo.url,
          filePath: fileInfo.filePath,
          fileSize: buffer.length,
          fileType: part.mimetype || 'application/octet-stream',
          folder: options?.folderId ? new Types.ObjectId(options.folderId) : undefined,
          source: options?.source || uploadType.toLowerCase(),
          sourceId: options?.sourceId ? new Types.ObjectId(options.sourceId) : undefined,
          storageType: 's3',
          s3Key,
        });
      } catch (error) {
        console.error('Failed to track file in media library:', error);
      }
    }

    return fileInfo;
  } else {
    ensureUploadDir(targetDir);
    const relativeFilePath = path.join(targetDir, fileName);
    const fullFilePath = path.join(UPLOADS_ROOT, relativeFilePath);

    return new Promise(async (resolve, reject) => {
      const writeStream = fs.createWriteStream(fullFilePath);
      part.file.pipe(writeStream);

      writeStream.on('finish', async () => {
        const stats = fs.statSync(fullFilePath);
        const protocol = request.protocol;
        const host = request.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const fileInfo: UploadedFileInfo = {
          originalName: part.filename,
          fileName,
          filePath: `/uploads/${relativeFilePath.replace(/\\/g, '/')}`,
          url: `${baseUrl}/uploads/${relativeFilePath.replace(/\\/g, '/')}`,
          fileSize: stats.size,
          mimeType: part.mimetype || 'application/octet-stream',
          uploadType,
          storageType: 'local'
        };

        if (options?.trackInMediaLibrary !== false) {
          try {
            await MediaFileModel.create({
              name: part.filename,
              url: fileInfo.url,
              filePath: fileInfo.filePath,
              fileSize: stats.size,
              fileType: part.mimetype || 'application/octet-stream',
              folder: options?.folderId ? new Types.ObjectId(options.folderId) : undefined,
              source: options?.source || uploadType.toLowerCase(),
              sourceId: options?.sourceId ? new Types.ObjectId(options.sourceId) : undefined,
              storageType: 'local'
            });
          } catch (error) {
            console.error('Failed to track file in media library:', error);
          }
        }

        resolve(fileInfo);
      });

      writeStream.on('error', reject);
    });
  }
};

export const deleteUploadedFile = async (relativeFilePath: string, storageType?: 'local' | 's3') => {
  if (!relativeFilePath) return;
  
  const s3Configured = await isS3Configured();
  
  if (storageType === 's3' || s3Configured) {
    await deleteFromS3(relativeFilePath.replace(/^\/*uploads\//, ''));
  }

  if (storageType === 'local' || !s3Configured) {
    const fullPath = path.join(UPLOADS_ROOT, relativeFilePath.replace(/^\/*uploads\//, '').replace(/^\/+/, ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  UPLOAD_TYPES,
  ensureUploadDir,
  generateUniqueFileName,
  validateFileType,
  saveFileFromPart,
  deleteUploadedFile,
  formatFileSize
};
