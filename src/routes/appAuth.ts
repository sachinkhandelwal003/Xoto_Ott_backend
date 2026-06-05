
import type { FastifyPluginAsync } from 'fastify';
import { sendOtp, verifyOtp } from '../controllers/appAuthController';

const appAuthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/app/auth/send-otp', sendOtp);
  fastify.post('/app/auth/verify-otp', verifyOtp);
};

export default appAuthRoutes;
