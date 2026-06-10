import type { FastifyPluginAsync } from 'fastify';
import {
  listFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  bulkDeleteFAQs,
} from '../controllers/faqController';

const faqsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // List all FAQs with pagination
  fastify.get('/', listFAQs);

  // Get FAQ by ID
  fastify.get('/item/:faqId', getFAQById);

  // Create new FAQ
  fastify.post('/', createFAQ);

  // Update FAQ
  fastify.put('/item/:faqId', updateFAQ);

  // Delete FAQ
  fastify.delete('/item/:faqId', deleteFAQ);

  // Bulk delete FAQs
  fastify.post('/bulk-delete', bulkDeleteFAQs);
};

export default faqsRoutes;
