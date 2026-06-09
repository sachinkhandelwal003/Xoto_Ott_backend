
import type { FastifyInstance } from 'fastify';
import {
  listPages,
  getPageBySlug,
  createPage,
  getPageById,
  updatePage,
  deletePage,
} from '../controllers/pagesController';

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/pages', listPages);
  fastify.post('/pages', createPage);
  fastify.get('/pages/:id', getPageById);
  fastify.get('/pages/slug/:slug', getPageBySlug);
  fastify.put('/pages/:id', updatePage);
  fastify.delete('/pages/:id', deletePage);
}

