import type { FastifyPluginAsync } from 'fastify';
import {
  getAllEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getSeasons,
} from '../controllers/episodeController';

const episodes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', getAllEpisodes);
  fastify.post('/', createEpisode);
  fastify.get('/seasons', getSeasons);
  fastify.get('/:id', getEpisodeById);
  fastify.put('/:id', updateEpisode);
  fastify.delete('/:id', deleteEpisode);
};

export default episodes;
