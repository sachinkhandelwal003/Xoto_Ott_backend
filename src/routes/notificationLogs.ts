import type { FastifyPluginAsync } from 'fastify';
import {
  listNotificationLogs,
  getNotificationLogById,
  createNotificationLog,
  deleteNotificationLog,
  bulkDeleteNotificationLogs,
} from '../controllers/notificationLogController';

const notificationLogsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // List all notification logs with pagination and type filter
  fastify.get('/', listNotificationLogs);

  // Get notification log by ID
  fastify.get('/item/:notificationId', getNotificationLogById);

  // Create new notification log
  fastify.post('/', createNotificationLog);

  // Delete notification log
  fastify.delete('/item/:notificationId', deleteNotificationLog);

  // Bulk delete notification logs
  fastify.post('/bulk-delete', bulkDeleteNotificationLogs);
};

export default notificationLogsRoutes;
