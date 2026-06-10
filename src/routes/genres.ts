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
  fastify.get('/', listGenres);

  // Get genre by ID
  fastify.get('/item/:genreId', getGenreById);

  // Create new genre
  fastify.post('/', createGenre);

  // Update genre
  fastify.put('/item/:genreId', updateGenre);

  // Delete genre
  fastify.delete('/item/:genreId', deleteGenre);

  // Bulk delete genres
  fastify.post('/bulk-delete', bulkDeleteGenres);
};

export default genresRoutes;
