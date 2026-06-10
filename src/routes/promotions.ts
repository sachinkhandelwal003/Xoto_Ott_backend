import type { FastifyPluginAsync } from 'fastify';
import {
  listPromotions,
  getPromotion,
  getActivePromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  bulkDeletePromotions,
} from '../controllers/promotionController';

const promotionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/promotions', listPromotions);
  fastify.get('/promotions/active', getActivePromotion);
  fastify.get('/promotions/:id', getPromotion);
  fastify.post('/promotions', createPromotion);
  fastify.put('/promotions/:id', updatePromotion);
  fastify.delete('/promotions/:id', deletePromotion);
  fastify.post('/promotions/bulk-delete', bulkDeletePromotions);
};

export default promotionsRoutes;
