import { requirePermission } from '../middlewares/rbac';
import type { FastifyPluginAsync } from 'fastify';
import {
  listCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
} from '../controllers/countryController';

const countriesRoutes: FastifyPluginAsync = async (fastify) => {
  // List all countries with pagination
  fastify.get('/', { onRequest: [requirePermission('categories', 'canView')] }, listCountries);

  // Get country by ID
  fastify.get('/:id', { onRequest: [requirePermission('categories', 'canView')] }, getCountryById);

  // Create new country
  fastify.post('/', { onRequest: [requirePermission('categories', 'canCreate')] }, createCountry);

  // Update country
  fastify.put('/:id', { onRequest: [requirePermission('categories', 'canEdit')] }, updateCountry);

  // Delete country
  fastify.delete('/:id', { onRequest: [requirePermission('categories', 'canDelete')] }, deleteCountry);
};

export default countriesRoutes;
