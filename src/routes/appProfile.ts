import type { FastifyPluginAsync } from 'fastify';
import { getAppProfile, updateVideoQuality, updatePreferredLanguage, deleteAppAccount, updateAppProfile, uploadAppAvatar } from '../controllers/appProfileController';

const appProfileRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/app/profile
  fastify.get('/profile', getAppProfile);

  // PATCH /api/app/profile — update name / email / avatar URL
  fastify.patch('/profile', updateAppProfile);

  // POST /api/app/profile/avatar — multipart avatar upload
  fastify.post('/profile/avatar', uploadAppAvatar);

  // PUT /api/app/profile/video-quality
  fastify.put('/profile/video-quality', updateVideoQuality);

  // PUT /api/app/profile/language
  fastify.put('/profile/language', updatePreferredLanguage);

  // DELETE /api/app/profile
  fastify.delete('/profile', deleteAppAccount);
};

export default appProfileRoutes;
