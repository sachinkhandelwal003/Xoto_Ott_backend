
import type { FastifyInstance } from 'fastify';
import {
  listActiveAds,
  createAd,
  getAdById,
  updateAd,
  deleteAd,
  trackAdView,
  trackAdClick,
} from '../controllers/adsController';

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/ads', listActiveAds);
  fastify.post('/ads', createAd);
  fastify.get('/ads/:id', getAdById);
  fastify.put('/ads/:id', updateAd);
  fastify.delete('/ads/:id', deleteAd);
  fastify.post('/ads/:id/view', trackAdView);
  fastify.post('/ads/:id/click', trackAdClick);
}

