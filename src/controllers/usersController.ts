
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getIsMongoConnected } from '../lib/mongodb';
import { UserModel } from '../models/User';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../lib/mockStore';

function docId(doc: any) {
  if (doc._id) { doc.id = String(doc._id); delete doc._id; delete doc.__v; }
  return doc;
}

export const listUsers = async (request: FastifyRequest, _reply: FastifyReply) => {
  const q = request.query as {
    search?: string; plan?: string; status?: string;
    page?: string; limit?: string;
  };
  const page = Math.max(1, parseInt(q.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(q.limit || '20', 10)));

  if (getIsMongoConnected()) {
    const filter: Record<string, unknown> = {};
    if (q.plan) filter.subscriptionPlan = q.plan;
    if (q.status) filter.status = q.status;
    if (q.search) {
      const re = new RegExp(q.search, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const [rawItems, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-passwordHash')
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: rawItems.map(d => docId(d as any)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  const result = getAllUsers({ search: q.search, plan: q.plan, page, limit });
  return {
    success: true,
    data: result.items,
    pagination: {
      page,
      limit,
      total: result.total,
      pages: Math.ceil(result.total / limit)
    }
  };
};

export const getSingleUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  if (getIsMongoConnected()) {
    const doc = await UserModel.findById(id).select('-passwordHash').lean();
    if (!doc) return reply.status(404).send({ success: false, error: 'User not found' });
    return { success: true, data: docId(doc as any) };
  }

  const user = getUserById(id);
  if (!user) return reply.status(404).send({ success: false, error: 'User not found' });
  return { success: true, data: user };
};

export const updateSingleUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const body = request.body as Record<string, unknown>;
  delete body.passwordHash;

  if (getIsMongoConnected()) {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: body }, { new: true })
      .select('-passwordHash')
      .lean();
    if (!doc) return reply.status(404).send({ error: 'User not found' });
    return docId(doc as any);
  }

  const updated = updateUser(id, body);
  if (!updated) return reply.status(404).send({ error: 'User not found' });
  return updated;
};

export const banSingleUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const body = request.body as { reason?: string };

  if (getIsMongoConnected()) {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: { status: 'banned', banReason: body?.reason || 'Violation of terms' } },
      { new: true }
    ).select('-passwordHash').lean();
    if (!doc) return reply.status(404).send({ error: 'User not found' });
    return docId(doc as any);
  }

  const updated = updateUser(id, { status: 'banned' });
  if (!updated) return reply.status(404).send({ error: 'User not found' });
  return updated;
};

export const unbanSingleUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  if (getIsMongoConnected()) {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: { status: 'active', banReason: null } },
      { new: true }
    ).select('-passwordHash').lean();
    if (!doc) return reply.status(404).send({ error: 'User not found' });
    return docId(doc as any);
  }

  const updated = updateUser(id, { status: 'active' });
  if (!updated) return reply.status(404).send({ error: 'User not found' });
  return updated;
};

export const deleteSingleUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  if (getIsMongoConnected()) {
    const doc = await UserModel.findByIdAndDelete(id);
    if (!doc) return reply.status(404).send({ error: 'User not found' });
    return reply.status(204).send();
  }

  const ok = deleteUser(id);
  if (!ok) return reply.status(404).send({ error: 'User not found' });
  return reply.status(204).send();
};
