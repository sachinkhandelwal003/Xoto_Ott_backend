import { requirePermission } from '../middlewares/rbac';
import type { FastifyPluginAsync } from 'fastify';
import {
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  bulkDeleteSubscriptions,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/subscriptionController';

const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/subscriptions', { onRequest: [requirePermission('subscriptions', 'canView')] }, listSubscriptions);
  fastify.get('/subscriptions/:id', { onRequest: [requirePermission('subscriptions', 'canView')] }, getSubscriptionById);
  fastify.post('/subscriptions', { onRequest: [requirePermission('subscriptions', 'canCreate')] }, createSubscription);
  fastify.put('/subscriptions/:id', { onRequest: [requirePermission('subscriptions', 'canEdit')] }, updateSubscription);
  fastify.delete('/subscriptions/:id', { onRequest: [requirePermission('subscriptions', 'canDelete')] }, deleteSubscription);
  fastify.post('/subscriptions/bulk-delete', { onRequest: [requirePermission('subscriptions', 'canDelete')] }, bulkDeleteSubscriptions);
  
  // Razorpay
  fastify.post('/subscriptions/razorpay/order', { onRequest: [requirePermission('subscriptions', 'canCreate')] }, createRazorpayOrder);
  fastify.post('/subscriptions/razorpay/verify', { onRequest: [requirePermission('subscriptions', 'canCreate')] }, verifyRazorpayPayment);
};

export default subscriptionRoutes;
