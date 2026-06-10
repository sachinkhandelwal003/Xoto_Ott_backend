import type { FastifyPluginAsync } from 'fastify';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
} from '../controllers/categoryController';

const categories: FastifyPluginAsync = async (fastify) => {
  // Get all categories
  fastify.get('/', listCategories);
  // Get single category
  fastify.get('/item/:categoryId', getCategoryById);
  // Create category
  fastify.post('/', createCategory);
  // Update category
  fastify.put('/item/:categoryId', updateCategory);
  // Delete category
  fastify.delete('/item/:categoryId', deleteCategory);
  // Bulk delete categories
  fastify.post('/bulk-delete', bulkDeleteCategories);
};

export default categories;
