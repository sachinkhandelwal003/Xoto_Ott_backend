import { requirePermission } from '../middlewares/rbac';
import type { FastifyPluginAsync } from 'fastify';
import {
  listGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
  bulkDeleteGenres,
} from '../controllers/genreController';

const genresRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // List all genres with pagination
  fastify.get('/', { onRequest: [requirePermission('genres', 'canView')] }, listGenres);

  // Get genre by ID
  fastify.get('/item/:genreId', { onRequest: [requirePermission('genres', 'canView')] }, getGenreById);

  // Create new genre
  fastify.post('/', { onRequest: [requirePermission('genres', 'canCreate')] }, createGenre);

  // Update genre
  fastify.put('/item/:genreId', { onRequest: [requirePermission('genres', 'canEdit')] }, updateGenre);

  // Delete genre
  fastify.delete('/item/:genreId', { onRequest: [requirePermission('genres', 'canDelete')] }, deleteGenre);

  // Bulk delete genres
  fastify.post('/bulk-delete', { onRequest: [requirePermission('genres', 'canCreate')] }, bulkDeleteGenres);
};

export default genresRoutes;
