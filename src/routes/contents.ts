import type { FastifyPluginAsync } from 'fastify';
import {
  getAllContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  updateContentStatus,
  appendContentVideo,
} from '../controllers/contentController';

const contents: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', getAllContents);
  fastify.post('/', createContent);
  fastify.get('/:id', getContentById);
  fastify.put('/:id', updateContent);
  fastify.delete('/:id', deleteContent);
  fastify.patch('/:id/status', updateContentStatus);
  fastify.post('/:id/videos', appendContentVideo);
};

export default contents;
