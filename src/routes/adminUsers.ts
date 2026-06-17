import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middlewares/auth';
import {
  getAllAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetUserPassword,
  toggleUserStatus,
  updateOwnProfile,
} from '../controllers/adminUserController';

const adminUsersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { onRequest: [authenticate] }, getAllAdminUsers);
  fastify.get('/:id', { onRequest: [authenticate] }, getAdminUserById);
  fastify.post('/', { onRequest: [authenticate] }, createAdminUser);
  fastify.put('/:id', { onRequest: [authenticate] }, updateAdminUser);
  fastify.delete('/:id', { onRequest: [authenticate] }, deleteAdminUser);
  fastify.post('/:id/reset-password', { onRequest: [authenticate] }, resetUserPassword);
  fastify.patch('/:id/toggle-status', { onRequest: [authenticate] }, toggleUserStatus);
  fastify.put('/profile', { onRequest: [authenticate] }, updateOwnProfile);
};

export default adminUsersRoutes;
