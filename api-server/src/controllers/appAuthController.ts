
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserModel } from '../models/User';
import { MessageCentralService } from '../services/messageCentralService';
import { revokeRefreshToken, revokeAllUserTokens } from '../lib/redis';

const messageCentralService = new MessageCentralService();
const STATIC_OTP = '1234';

// Validation schemas
const sendOtpSchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
});

const verifyOtpSchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  verificationId: z.string().optional(),
  otp: z.string().regex(/^\d{4}$/, 'OTP must be 4 digits'),
});

const setLanguageSchema = z.object({
  language: z.string().trim().min(1, 'Language is required'),
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
    const { mobileNumber } = body.data;

    const result = await messageCentralService.sendOtp(mobileNumber);
    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.status(200).send(result);
  } catch (error) {
    console.error('Error sending OTP:', error);
    console.error('Error stack:', (error as Error).stack);
    return reply.status(500).send({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message 
    });
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
      return reply.status(400).send({ 
        success: false, 
        message: verifyResult.message || `Invalid OTP. Use ${STATIC_OTP}` 
      });
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
        languageSelectionSkipped: false,
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
    console.error('Error stack:', (error as Error).stack);
    return reply.status(500).send({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message 
    });
  }
};

export const setPreferredLanguage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = request.params as { userId: string };
    const body = setLanguageSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validation failed',
        errors: body.error.flatten().fieldErrors,
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    user.preferredLanguage = body.data.language;
    user.languageSelectionSkipped = false;
    if (user.profiles.length > 0) {
      user.profiles[0].language = body.data.language;
    }
    await user.save();

    return reply.status(200).send({
      success: true,
      message: 'Preferred language updated successfully',
      data: {
        userId: user._id.toString(),
        preferredLanguage: user.preferredLanguage,
        languageSelectionSkipped: user.languageSelectionSkipped,
      },
    });
  } catch (error) {
    console.error('Error setting preferred language:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

export const skipPreferredLanguage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = request.params as { userId: string };

    const user = await UserModel.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    user.preferredLanguage = undefined;
    user.languageSelectionSkipped = true;
    if (user.profiles.length > 0) {
      user.profiles[0].language = undefined;
    }
    await user.save();

    return reply.status(200).send({
      success: true,
      message: 'Language selection skipped successfully',
      data: {
        userId: user._id.toString(),
        preferredLanguage: null,
        languageSelectionSkipped: true,
      },
    });
  } catch (error) {
    console.error('Error skipping preferred language:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    console.error('Error logging out:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

export const deleteAccount = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user?.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(userId);
    
    // Deactivate the user instead of hard deleting for audit purposes
    await UserModel.findByIdAndUpdate(userId, {
      $set: { status: 'inactive' }
    });
    
    return {
      success: true,
      message: 'Account deactivated successfully',
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

export const shareApp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    return {
      success: true,
      data: {
        message: 'Check out this awesome OTT app!',
        link: 'https://example.com/download',
        shareText: 'I found this great OTT app - you should try it!',
      },
    };
  } catch (error) {
    console.error('Error sharing app:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};

export const contactUs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message: string;
    };

    // You can save this to database or send an email here
    return {
      success: true,
      message: 'Your message has been received! We will get back to you soon.',
    };
  } catch (error) {
    console.error('Error handling contact us:', error);
    return reply.status(500).send({ success: false, message: 'Internal server error' });
  }
};
