import type { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SettingsModel } from '../models/Settings';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../../uploads');

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const saveUploadedFile = async (part: any, folder: string): Promise<string> => {
  ensureDir(path.join(uploadsRoot, folder));
  const uniqueName = `${Date.now()}-${(part.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadsRoot, folder, uniqueName);
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath);
    part.file.pipe(ws);
    ws.on('finish', () => resolve(`/uploads/${folder}/${uniqueName}`));
    ws.on('error', reject);
  });
};

async function getOrCreateSettings() {
  let settings = await SettingsModel.findOne();
  if (!settings) settings = await SettingsModel.create({});
  return settings;
}

export const getSettings = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const settings = await getOrCreateSettings();
    return reply.send(settings);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

export const updateSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as Record<string, any>;
    const settings = await SettingsModel.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true }
    );
    return reply.send(settings);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

// File field name -> Settings model field name
const LOGO_FIELD_MAP: Record<string, string> = {
  logo: 'logoUrl',
  darkLogo: 'darkLogoUrl',
  lightLogo: 'lightLogoUrl',
  favicon: 'faviconUrl',
};

export const uploadSettingsLogos = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const parts = request.parts();
    const updates: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file' && LOGO_FIELD_MAP[part.fieldname]) {
        const url = await saveUploadedFile(part, 'logos');
        updates[LOGO_FIELD_MAP[part.fieldname]] = url;
      }
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No logo files provided' });
    }

    const settings = await SettingsModel.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true }
    );
    return reply.send(settings);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Upload failed' });
  }
};
