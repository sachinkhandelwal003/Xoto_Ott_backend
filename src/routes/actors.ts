import type { FastifyPluginAsync } from 'fastify';
import {
  listActors,
  getActorById,
  createActor,
  updateActor,
  deleteActor,
  bulkDeleteActors,
} from '../controllers/actorController';

const actorsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // List all actors with pagination
  fastify.get('/', listActors);

  // Get actor by ID
  fastify.get('/item/:actorId', getActorById);

  // Create new actor
  fastify.post('/', createActor);

  // Update actor
  fastify.put('/item/:actorId', updateActor);

  // Delete actor
  fastify.delete('/item/:actorId', deleteActor);

  // Bulk delete actors
  fastify.post('/bulk-delete', bulkDeleteActors);
};

export default actorsRoutes;
