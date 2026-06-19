import { requirePermission } from '../middlewares/rbac';
import type { FastifyPluginAsync } from 'fastify';
import {
  listLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from '../controllers/languageController';

const languages: FastifyPluginAsync = async (fastify) => {
  // Get all languages (for users)
  fastify.get('/', { onRequest: [requirePermission('languages', 'canView')] }, listLanguages);
  // Get single language
  fastify.get('/:id', { onRequest: [requirePermission('languages', 'canView')] }, getLanguage);
  // Create language (admin only)
  fastify.post('/', { onRequest: [requirePermission('languages', 'canCreate')] }, createLanguage);
  // Update language (admin only)
  fastify.put('/:id', { onRequest: [requirePermission('languages', 'canEdit')] }, updateLanguage);
  // Delete language (admin only)
  fastify.delete('/:id', { onRequest: [requirePermission('languages', 'canDelete')] }, deleteLanguage);
};

export default languages;
