
import type { FastifyReply, FastifyRequest } from 'fastify';
import { PageModel } from '../models/Page';

export const createPage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;
    const page = await PageModel.create(body);
    return {
      success: true,
      data: page,
      message: "Page created successfully"
    };
  } catch (error: any) {
    console.error('Error creating page:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getPageById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const page = await PageModel.findById(id).lean();

    if (!page) {
      return reply.status(404).send({ success: false, message: 'Page not found' });
    }

    return { success: true, data: page };
  } catch (error: any) {
    console.error('Error getting page:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getPageBySlug = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { slug } = request.params as { slug: string };
    const page = await PageModel.findOne({ slug, status: 'published' }).lean();

    if (!page) {
      return reply.status(404).send({ success: false, message: 'Page not found' });
    }

    return { success: true, data: page };
  } catch (error: any) {
    console.error('Error getting page:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const listPages = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { admin } = request.query as any;
    const filter: any = admin ? {} : { status: 'published' };
    const pages = await PageModel.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return { success: true, data: pages };
  } catch (error: any) {
    console.error('Error listing pages:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updatePage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const page = await PageModel.findByIdAndUpdate(id, { $set: body }, { new: true });
    return { success: true, data: page, message: 'Page updated successfully' };
  } catch (error: any) {
    console.error('Error updating page:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deletePage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    await PageModel.findByIdAndDelete(id);
    return { success: true, message: 'Page deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error', error: error.message });
  }
};

