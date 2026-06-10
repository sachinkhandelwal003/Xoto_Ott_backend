import type { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationLogModel } from '../models/NotificationLog';

export const listNotificationLogs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as {
      page?: string;
      limit?: string;
      type?: string;
    };
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const typeFilter = query.type;

    const filter: any = {};
    if (typeFilter && typeFilter !== 'all') {
      filter.type = typeFilter;
    }

    const [notifications, total] = await Promise.all([
      NotificationLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NotificationLogModel.countDocuments(filter),
    ]);

    return reply.send({
      success: true,
      data: notifications.map((notification: any) => ({
        id: notification._id,
        type: notification.type,
        isHighlight: notification.isHighlight,
        title: notification.title,
        text: notification.text,
        userName: notification.userName,
        userEmail: notification.userEmail,
        updatedAt: notification.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const getNotificationLogById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { notificationId } = request.params as { notificationId: string };
    const notification = await NotificationLogModel.findById(notificationId).lean();

    if (!notification) {
      return reply.status(404).send({ success: false, error: 'Notification not found' });
    }

    return reply.send({
      success: true,
      data: {
        id: notification._id,
        type: notification.type,
        isHighlight: notification.isHighlight,
        title: notification.title,
        text: notification.text,
        userName: notification.userName,
        userEmail: notification.userEmail,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const createNotificationLog = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as {
      type: string;
      isHighlight?: boolean;
      title: string;
      text: string;
      userName: string;
      userEmail: string;
    };

    if (!body.type || !body.title || !body.text || !body.userName || !body.userEmail) {
      return reply.status(400).send({ success: false, error: 'Missing required fields' });
    }

    const notification = await NotificationLogModel.create({
      type: body.type,
      isHighlight: body.isHighlight || false,
      title: body.title,
      text: body.text,
      userName: body.userName,
      userEmail: body.userEmail,
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: notification._id,
        type: notification.type,
        isHighlight: notification.isHighlight,
        title: notification.title,
        text: notification.text,
        userName: notification.userName,
        userEmail: notification.userEmail,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const deleteNotificationLog = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { notificationId } = request.params as { notificationId: string };
    const notification = await NotificationLogModel.findByIdAndDelete(notificationId);

    if (!notification) {
      return reply.status(404).send({ success: false, error: 'Notification not found' });
    }

    return reply.send({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const bulkDeleteNotificationLogs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { ids } = request.body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ success: false, message: 'Invalid or empty ids array' });
    }

    const result = await NotificationLogModel.deleteMany({ _id: { $in: ids } });

    return {
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`,
      deletedCount: result.deletedCount,
    };
  } catch (error: any) {
    console.error('Error bulk deleting notifications:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};
