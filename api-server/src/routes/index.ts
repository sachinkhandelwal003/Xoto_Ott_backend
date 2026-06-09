import type { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health';
import authRoutes from './auth';
import appAuthRoutes from './appAuth';
import usersRoutes from './users';
import languagesRoutes from './languages';
import promotionsRoutes from './promotions';
import bannersRoutes from './banners';
import categoriesRoutes from './categories';
import contentsRoutes from './contents';
import adsRoutes from './ads';
import pagesRoutes from './pages';

const router: FastifyPluginAsync = async (fastify) => {
  fastify.register(healthRoutes);
  fastify.register(authRoutes);
  fastify.register(appAuthRoutes);
  fastify.register(usersRoutes);
  fastify.register(languagesRoutes, { prefix: '/languages' });
  fastify.register(promotionsRoutes);
  fastify.register(bannersRoutes);
  fastify.register(categoriesRoutes);
  fastify.register(contentsRoutes);
  fastify.register(adsRoutes);
  fastify.register(pagesRoutes);
};

export default router;
