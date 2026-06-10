import type { FastifyPluginAsync } from 'fastify';
import {
  listNotificationTemplates,
  getNotificationTemplateById,
  createNotificationTemplate,
  updateNotificationTemplate,
  toggleNotificationTemplateStatus,
  deleteNotificationTemplate,
} from '../controllers/notificationTemplateController';

const notificationTemplates: FastifyPluginAsync = async (fastify) => {
  // Get all notification templates
  fastify.get('/', listNotificationTemplates);
  
  // Get single notification template
  fastify.get('/item/:templateId', getNotificationTemplateById);
  
  // Create notification template
  fastify.post('/', createNotificationTemplate);
  
  // Update notification template
  fastify.put('/item/:templateId', updateNotificationTemplate);
  
  // Toggle notification template status
  fastify.patch('/item/:templateId/toggle-status', toggleNotificationTemplateStatus);
  
  // Delete notification template
  fastify.delete('/item/:templateId', deleteNotificationTemplate);
};

export default notificationTemplates;
