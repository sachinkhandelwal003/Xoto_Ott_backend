import type { FastifyPluginAsync } from 'fastify';
import {
  listPlanLimits,
  getPlanLimitById,
  createPlanLimit,
  updatePlanLimit,
  deletePlanLimit,
  bulkDeletePlanLimits,
} from '../controllers/planLimitController';

const planLimitsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/', listPlanLimits);
  fastify.get('/:id', getPlanLimitById);
  fastify.post('/', createPlanLimit);
  fastify.put('/:id', updatePlanLimit);
  fastify.delete('/:id', deletePlanLimit);
  fastify.post('/bulk-delete', bulkDeletePlanLimits);
};

export default planLimitsRoutes;
