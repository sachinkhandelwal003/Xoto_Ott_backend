
import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middlewares/auth';
import { login, getMe, logout, updateProfile, updatePassword } from '../controllers/authController';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/login', login);
  fastify.get('/auth/me', { onRequest: [authenticate] }, getMe);
  fastify.post('/auth/logout', logout);
  fastify.patch('/auth/profile', { onRequest: [authenticate] }, updateProfile);
  fastify.patch('/auth/password', { onRequest: [authenticate] }, updatePassword);
};

export default authRoutes;

