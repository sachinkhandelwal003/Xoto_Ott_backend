import type { FastifyPluginAsync } from 'fastify';
import {
  listDirectors,
  getDirectorById,
  createDirector,
  updateDirector,
  deleteDirector,
  bulkDeleteDirectors,
} from '../controllers/directorController';

const directorsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // List all directors with pagination
  fastify.get('/', listDirectors);

  // Get director by ID
  fastify.get('/item/:directorId', getDirectorById);

  // Create new director
  fastify.post('/', createDirector);

  // Update director
  fastify.put('/item/:directorId', updateDirector);

  // Delete director
  fastify.delete('/item/:directorId', deleteDirector);

  // Bulk delete directors
  fastify.post('/bulk-delete', bulkDeleteDirectors);
};

export default directorsRoutes;
