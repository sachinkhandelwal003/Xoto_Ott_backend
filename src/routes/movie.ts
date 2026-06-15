import type { FastifyPluginAsync } from 'fastify';
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  updateMovieStatus,
  toggleFeatured,
  toggleTrending,
} from '../controllers/movieController';

const movie: FastifyPluginAsync = async (fastify) => {
  // Get all movies with pagination and filtering
  fastify.get('/', getAllMovies);

  // Create new movie
  fastify.post('/', createMovie);

  // Get single movie by ID
  fastify.get('/:id', getMovieById);

  // Update movie by ID
  fastify.put('/:id', updateMovie);

  // Delete movie by ID
  fastify.delete('/:id', deleteMovie);

  // Update movie status
  fastify.patch('/:id/status', updateMovieStatus);

  // Toggle featured status
  fastify.patch('/:id/featured', toggleFeatured);

  // Toggle trending status
  fastify.patch('/:id/trending', toggleTrending);
};

export default movie;
