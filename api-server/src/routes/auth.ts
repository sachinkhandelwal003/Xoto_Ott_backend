
import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middlewares/auth';
import { login, getMe, logout, deleteAccount } from '../controllers/authController';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/login', login);
  fastify.get('/auth/me', { onRequest: [authenticate] }, getMe);
  fastify.post('/auth/logout', { onRequest: [authenticate] }, logout);
  fastify.delete('/auth/account', { onRequest: [authenticate] }, deleteAccount);
};

export default authRoutes;

