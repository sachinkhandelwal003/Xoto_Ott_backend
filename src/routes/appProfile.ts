import type { FastifyPluginAsync } from 'fastify';
import { getAppProfile, updateVideoQuality } from '../controllers/appProfileController';

const appProfileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/app/profile
  fastify.get('/profile', getAppProfile);

  // PUT /api/app/profile/video-quality
  fastify.put('/profile/video-quality', updateVideoQuality);
};

export default appProfileRoutes;
