
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserModel } from '../models/User';
import { MessageCentralService } from '../services/messageCentralService';

const messageCentralService = new MessageCentralService();

// Validation schemas
const sendOtpSchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  countryCode: z.string().optional().default('91'),
});

const verifyOtpSchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  verificationId: z.string().min(1, 'Verification ID is required'),
  otp: z.string().regex(/^\d{4}$/, 'OTP must be 4 digits'),
});

export const sendOtp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = sendOtpSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validation failed',
        errors: body.error.flatten().fieldErrors,
      });
    }
    const { mobileNumber, countryCode } = body.data;

    const result = await messageCentralService.sendOtp(mobileNumber, countryCode);
    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.status(200).send(result);
  } catch (error) {
    console.error('Error sending OTP:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

export const verifyOtp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = verifyOtpSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validation failed',
        errors: body.error.flatten().fieldErrors,
      });
    }
    const { mobileNumber, verificationId, otp } = body.data;

    const verifyResult = await messageCentralService.verifyOtp(verificationId, otp);
    if (!verifyResult.success) {
      return reply.status(400).send({ success: false, error: 'Invalid OTP' });
    }

    let user = await UserModel.findOne({ phone: mobileNumber });

    if (!user) {
      const newProfile = {
        name: 'User',
        isKids: false,
        maturityLevel: 18,
      };
      user = new UserModel({
        phone: mobileNumber,
        name: 'User',
        email: `${mobileNumber}@temp.local`,
        profiles: [newProfile],
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      user.loginCount += 1;
      await user.save();
    }

    const server = request.server as any;
    const tokenPayload = {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      role: 'user' as const,
    };
    const accessToken = server.jwt.sign(tokenPayload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    return reply.status(200).send({
      success: true,
      accessToken,
      userId: user._id.toString(),
      expiresIn: 900,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};
