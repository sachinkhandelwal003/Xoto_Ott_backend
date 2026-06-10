import type { FastifyPluginAsync } from 'fastify';
import { getAppSettings, updateAppSettings, addAppSetting, deleteAppSetting, editAppSetting } from '../controllers/appSettingController';

const appSettingsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/', getAppSettings);
  fastify.put('/', updateAppSettings);
  fastify.post('/', addAppSetting);
  fastify.delete('/:id', deleteAppSetting);
  fastify.patch('/:id', editAppSetting);
};

export default appSettingsRoutes;
