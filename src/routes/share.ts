import type { FastifyPluginAsync } from 'fastify';
import { handleShareRedirect } from '../controllers/shareController';

const shareRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/share/:contentId
  fastify.get('/share/:contentId', handleShareRedirect);
};

export default shareRoutes;
