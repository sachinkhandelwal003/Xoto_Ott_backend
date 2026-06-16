import type { FastifyRequest, FastifyReply } from 'fastify';
import { AdminUserModel } from '../models/AdminUser';

// Check if user has specific permission for a module
export const checkPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'upload') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      
      if (!user) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }

      // Superadmin has all permissions
      if (user.role === 'superadmin') {
        return;
      }

      // Get fresh user data from database to check current permissions
      const adminUser = await AdminUserModel.findById(user.id);
      if (!adminUser) {
        return reply.status(401).send({ success: false, error: 'User not found' });
      }

      // Check if user is active
      if (!adminUser.isActive) {
        return reply.status(403).send({ success: false, error: 'Account is inactive' });
      }

      // Check module permissions
      const modulePermissions = adminUser.modulePermissions;
      if (!modulePermissions) {
        return reply.status(403).send({ success: false, error: 'No permissions configured' });
      }

      const permissionKey = module as keyof typeof modulePermissions;
      const modulePerm = modulePermissions[permissionKey];

      if (!modulePerm) {
        return reply.status(403).send({ success: false, error: `No permissions for ${module}` });
      }

      // Map action to permission field
      const actionMap: Record<string, string> = {
        view: 'canView',
        create: 'canCreate',
        edit: 'canEdit',
        delete: 'canDelete',
        upload: 'canUpload',
      };

      const permissionField = actionMap[action];
      if (!permissionField || !(permissionField in modulePerm)) {
        return reply.status(403).send({ success: false, error: 'Invalid permission action' });
      }

      if (!modulePerm[permissionField as keyof typeof modulePerm]) {
        return reply.status(403).send({ 
          success: false, 
          error: `You don't have permission to ${action} ${module}` 
        });
      }

      // Attach user permissions to request for use in controllers
      (request as any).userPermissions = modulePermissions;
    } catch (error) {
      console.error('Permission check error:', error);
      return reply.status(500).send({ success: false, error: 'Permission check failed' });
    }
  };
};

// Check if user has admin role
export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = (request as any).user;
  
  if (!user) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }

  if (user.role !== 'superadmin' && user.role !== 'admin') {
    return reply.status(403).send({ success: false, error: 'Admin access required' });
  }
};

// Check if user is superadmin
export const requireSuperAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = (request as any).user;
  
  if (!user) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }

  if (user.role !== 'superadmin') {
    return reply.status(403).send({ success: false, error: 'Superadmin access required' });
  }
};
