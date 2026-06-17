import type { FastifyReply, FastifyRequest } from 'fastify';
import { SettingsModel } from '../models/Settings';
import uploadHandler from '../lib/uploadHandler';
import { updateEnvFile } from '../lib/envUpdater';

async function getOrCreateSettings() {
  let settings = await SettingsModel.findOne();
  if (!settings) settings = await SettingsModel.create({});
  return settings;
}

export const getSettings = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const settings = await getOrCreateSettings();
    return reply.send({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error(error);
    return reply.status(500).send({ success: false, error: error.message });
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

    // Sync SMTP fields to .env so they're available as env vars immediately
    const envUpdates: Record<string, string> = {};
    if (body.mailHost !== undefined)     envUpdates.EMAIL_HOST     = body.mailHost;
    if (body.mailPort !== undefined)     envUpdates.EMAIL_PORT     = String(body.mailPort);
    if (body.mailEncryption !== undefined) envUpdates.EMAIL_SECURE = body.mailEncryption === 'ssl' ? 'true' : 'false';
    if (body.mailUsername !== undefined) envUpdates.EMAIL_USER     = body.mailUsername;
    if (body.mailPassword !== undefined && body.mailPassword) envUpdates.EMAIL_PASS = body.mailPassword;
    if (body.mailFrom !== undefined)     envUpdates.EMAIL_FROM     = body.mailFrom;
    if (body.mailFromName !== undefined) envUpdates.EMAIL_FROM_NAME = body.mailFromName;

    if (Object.keys(envUpdates).length > 0) {
      updateEnvFile(envUpdates);
    }

    return reply.send({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error(error);
    return reply.status(500).send({ success: false, error: error.message });
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
        const uploadedFile = await uploadHandler.saveFileFromPart(part, request, 'IMAGE');
        updates[LOGO_FIELD_MAP[part.fieldname]] = uploadedFile.filePath;
      }
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ success: false, error: 'No logo files provided' });
    }

    const settings = await SettingsModel.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true }
    );
    return reply.send({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error(error);
    return reply.status(500).send({ success: false, error: 'Upload failed' });
  }
};
