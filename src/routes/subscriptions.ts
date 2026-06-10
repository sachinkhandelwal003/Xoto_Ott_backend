import type { FastifyPluginAsync } from 'fastify';
import {
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  bulkDeleteSubscriptions,
} from '../controllers/subscriptionController';

const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/subscriptions', listSubscriptions);
  fastify.get('/subscriptions/:id', getSubscriptionById);
  fastify.post('/subscriptions', createSubscription);
  fastify.put('/subscriptions/:id', updateSubscription);
  fastify.delete('/subscriptions/:id', deleteSubscription);
  fastify.post('/subscriptions/bulk-delete', bulkDeleteSubscriptions);
};

export default subscriptionRoutes;
