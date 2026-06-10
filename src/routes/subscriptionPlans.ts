import type { FastifyPluginAsync } from 'fastify';
import {
  listSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  bulkDeleteSubscriptionPlans,
} from '../controllers/subscriptionPlanController';

const subscriptionPlansRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/', listSubscriptionPlans);
  fastify.get('/:id', getSubscriptionPlanById);
  fastify.post('/', createSubscriptionPlan);
  fastify.put('/:id', updateSubscriptionPlan);
  fastify.delete('/:id', deleteSubscriptionPlan);
  fastify.post('/bulk-delete', bulkDeleteSubscriptionPlans);
};

export default subscriptionPlansRoutes;
