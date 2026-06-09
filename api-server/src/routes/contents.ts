import type { FastifyInstance } from 'fastify';
import {
  listContent,
  createContent,
  getContentById,
  updateContent,
  deleteContent,
  searchContent,
  getRandomShows,
  appendContentVideo,
  updateContentEpisodeLock
} from '../controllers/contentController';

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/contents', listContent);
  fastify.post('/contents', createContent);
  fastify.get('/contents/search', searchContent);
  fastify.get('/contents/random', getRandomShows);
  fastify.get('/contents/:id', getContentById);
  fastify.put('/contents/:id', updateContent);
  fastify.delete('/contents/:id', deleteContent);
  fastify.post('/contents/:id/videos', appendContentVideo);
  fastify.put('/contents/episodes/:episodeId/lock', updateContentEpisodeLock);
}
