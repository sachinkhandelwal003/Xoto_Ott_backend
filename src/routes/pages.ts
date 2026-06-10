import type { FastifyPluginAsync } from 'fastify';
import {
  listPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  bulkDeletePages,
} from '../controllers/pageController';

const pagesRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // List all pages with pagination
  fastify.get('/', listPages);

  // Get page by slug
  fastify.get('/:slug', getPageById);

  // Get page by ID
  fastify.get('/item/:pageId', getPageById);

  // Create new page
  fastify.post('/', createPage);

  // Update page
  fastify.put('/:pageId', updatePage);

  // Delete page
  fastify.delete('/:pageId', deletePage);

  // Bulk delete pages
  fastify.post('/bulk-delete', bulkDeletePages);
};

export default pagesRoutes;
