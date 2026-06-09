
import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middlewares/auth';
import {
  sendOtp,
  setPreferredLanguage,
  skipPreferredLanguage,
  verifyOtp,
  logout,
  deleteAccount,
  shareApp,
  contactUs
} from '../controllers/appAuthController';

const appAuthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/app/auth/send-otp', sendOtp);
  fastify.post('/app/auth/verify-otp', verifyOtp);
  fastify.post('/app/auth/logout', { onRequest: [authenticate] }, logout);
  fastify.delete('/app/users/me/delete-account', { onRequest: [authenticate] }, deleteAccount);
  fastify.get('/app/share', shareApp);
  fastify.post('/app/contact-us', contactUs);
  fastify.post('/app/users/:userId/language', { onRequest: [authenticate] }, setPreferredLanguage);
  fastify.post('/app/users/:userId/language/skip', { onRequest: [authenticate] }, skipPreferredLanguage);
};

export default appAuthRoutes;
