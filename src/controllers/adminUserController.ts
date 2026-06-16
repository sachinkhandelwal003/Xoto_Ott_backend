import type { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AdminUserModel } from '../models/AdminUser';
import { logger } from '../lib/logger';
import { sendWelcomeEmail } from '../lib/email';

// Generate random password
const generatePassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Get all admin users with pagination
export const getAllAdminUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      role?: string;
      status?: string;
    };

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.role) filter.role = query.role;
    if (query.status === 'active') filter.isActive = true;
    if (query.status === 'inactive') filter.isActive = false;

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      AdminUserModel.find(filter)
        .select('-passwordHash')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminUserModel.countDocuments(filter),
    ]);

    const usersWithId = users.map((user) => ({
      ...user,
      id: user._id?.toString(),
    }));

    return reply.send({
      success: true,
      data: usersWithId,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting all admin users');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Get single admin user by ID
export const getAdminUserById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };

    const user = await AdminUserModel.findById(id)
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .lean();

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    return reply.send({
      success: true,
      data: {
        ...user,
        id: user._id?.toString(),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting admin user by ID');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Create new admin user (influencer)
export const createAdminUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;
    const currentUser = (request as any).user;

    // Check if email already exists
    const existingUser = await AdminUserModel.findOne({ email: body.email.toLowerCase() });
    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'Email already exists' });
    }

    // Generate random password
    const password = generatePassword(12);
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await AdminUserModel.create({
      email: body.email.toLowerCase(),
      name: body.name,
      phone: body.phone,
      passwordHash,
      role: body.role || 'influencer',
      modulePermissions: body.modulePermissions,
      createdBy: currentUser?.id,
    });

    // Send welcome email with credentials
    const emailSent = await sendWelcomeEmail(body.email, body.name, body.email, password);

    return reply.status(201).send({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id?.toString(),
        password, // Only return password in response for admin to see
        emailSent,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating admin user');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Update admin user
export const updateAdminUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    // Check if email is being changed and if it already exists
    if (body.email) {
      const existingUser = await AdminUserModel.findOne({ 
        email: body.email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUser) {
        return reply.status(400).send({ success: false, error: 'Email already exists' });
      }
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email.toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role) updateData.role = body.role;
    if (body.modulePermissions) updateData.modulePermissions = body.modulePermissions;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await AdminUserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .lean();

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    return reply.send({
      success: true,
      data: {
        ...user,
        id: user._id?.toString(),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error updating admin user');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Delete admin user
export const deleteAdminUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;

    // Prevent self-deletion
    if (currentUser?.id === id) {
      return reply.status(400).send({ success: false, error: 'Cannot delete your own account' });
    }

    const user = await AdminUserModel.findByIdAndDelete(id);

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    return reply.send({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    logger.error({ error }, 'Error deleting admin user');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Reset user password
export const resetUserPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };

    const user = await AdminUserModel.findById(id);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    // Generate new password
    const password = generatePassword(12);
    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    await user.save();

    // Send email with new password
    const emailSent = await sendWelcomeEmail(user.email, user.name, user.email, password);

    return reply.send({
      success: true,
      data: {
        password, // Return new password for admin to see
        emailSent,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error resetting user password');
    return reply.status(500).send({ success: false, error: error.message });
  }
};

// Update own profile (email/password)
export const updateOwnProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = (request as any).user;
    const body = request.body as any;

    if (!currentUser) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (body.email) {
      // Check if email is being changed and if it already exists
      const existingUser = await AdminUserModel.findOne({ 
        email: body.email.toLowerCase(),
        _id: { $ne: currentUser.id }
      });
      if (existingUser) {
        return reply.status(400).send({ success: false, error: 'Email already exists' });
      }
      updateData.email = body.email.toLowerCase();
    }
    if (body.currentPassword && body.newPassword) {
      // Verify current password
      const user = await AdminUserModel.findById(currentUser.id);
      if (!user) {
        return reply.status(404).send({ success: false, error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(400).send({ success: false, error: 'Current password is incorrect' });
      }

      updateData.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    const user = await AdminUserModel.findByIdAndUpdate(
      currentUser.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-passwordHash')
      .lean();

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    return reply.send({
      success: true,
      data: {
        ...user,
        id: user._id?.toString(),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error updating own profile');
    return reply.status(500).send({ success: false, error: error.message });
  }
};
export const toggleUserStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const currentUser = (request as any).user;

    // Prevent self-deactivation
    if (currentUser?.id === id) {
      return reply.status(400).send({ success: false, error: 'Cannot deactivate your own account' });
    }

    const user = await AdminUserModel.findById(id);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    return reply.send({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id?.toString(),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error toggling user status');
    return reply.status(500).send({ success: false, error: error.message });
  }
};
