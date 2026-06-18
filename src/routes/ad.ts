import { FastifyInstance } from 'fastify';
import { getAds, createAd, updateAd, deleteAd, bulkDeleteAds, getActiveAds, recordAdInteraction } from '../controllers/adController';
import { authenticate } from '../middlewares/auth';

export default async function (fastify: FastifyInstance) {
  // --- Admin Routes ---
  fastify.get('/ads', { preHandler: [authenticate] }, getAds);
  fastify.post('/ads', { preHandler: [authenticate] }, createAd);
  fastify.put('/ads/:id', { preHandler: [authenticate] }, updateAd);
  fastify.delete('/ads/:id', { preHandler: [authenticate] }, deleteAd);
  fastify.post('/ads/bulk-delete', { preHandler: [authenticate] }, bulkDeleteAds);

  // --- App / Public Routes ---
  fastify.get('/app/ads', getActiveAds);
  fastify.post('/app/ads/:id/interaction', recordAdInteraction);
}
