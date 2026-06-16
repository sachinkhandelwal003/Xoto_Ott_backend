import type { FastifyPluginAsync } from 'fastify';
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
  // Get all admin users with pagination
  fastify.get('/', getAllAdminUsers);

  // Get single admin user by ID
  fastify.get('/:id', getAdminUserById);

  // Create new admin user
  fastify.post('/', createAdminUser);

  // Update admin user
  fastify.put('/:id', updateAdminUser);

  // Delete admin user
  fastify.delete('/:id', deleteAdminUser);

  // Reset user password
  fastify.post('/:id/reset-password', resetUserPassword);

  // Toggle user active status
  fastify.patch('/:id/toggle-status', toggleUserStatus);

  // Update own profile
  fastify.put('/profile', updateOwnProfile);
};

export default adminUsersRoutes;
