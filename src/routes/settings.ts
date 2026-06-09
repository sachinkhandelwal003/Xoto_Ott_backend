import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middlewares/auth';
import { getSettings, updateSettings, uploadSettingsLogos } from '../controllers/settingsController';

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/settings', { onRequest: [authenticate] }, getSettings);
  fastify.put('/settings', { onRequest: [authenticate] }, updateSettings);
  fastify.post('/settings/upload-logos', { onRequest: [authenticate] }, uploadSettingsLogos);
};

export default settingsRoutes;
