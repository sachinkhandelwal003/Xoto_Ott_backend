import type { FastifyInstance } from 'fastify';
import {
  listCategories,
  getCategoriesWithContent,
  getCategoryById,
  getCategoryContents,
  createCategory,
  updateCategory,
  deleteCategory,
  addContentToCategory,
  removeContentFromCategory,
  createCategoryShow,
  appendCategoryShowVideo,
  getCategoryShow,
  updateCategoryEpisodeLock,
} from '../controllers/categoryController';

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/categories', listCategories);
  fastify.get('/categories/with-content', getCategoriesWithContent);
  fastify.post('/categories', createCategory);
  fastify.get('/categories/item/:categoryId', getCategoryById);
  fastify.put('/categories/item/:categoryId', updateCategory);
  fastify.delete('/categories/item/:categoryId', deleteCategory);
  fastify.get('/categories/:categoryId/contents', getCategoryContents);
  fastify.post('/categories/:categoryId/contents/:contentId', addContentToCategory);
  fastify.delete('/categories/:categoryId/contents/:contentId', removeContentFromCategory);
  fastify.post('/categories/show', createCategoryShow);
  fastify.post('/categories/:contentId/videos', appendCategoryShowVideo);
  fastify.get('/categories/:contentId', getCategoryShow);
  fastify.put('/categories/episodes/:episodeId/lock', updateCategoryEpisodeLock);
};
