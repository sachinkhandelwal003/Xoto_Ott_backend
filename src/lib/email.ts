import nodemailer from 'nodemailer';
import { SettingsModel } from '../models/Settings';

// Get mail config — prefers DB settings, falls back to env vars
const getMailConfig = async () => {
  try {
    const settings = await SettingsModel.findOne().lean();
    if (settings && settings.mailUsername && settings.mailPassword) {
      return {
        host: settings.mailHost || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(settings.mailPort || process.env.EMAIL_PORT || '587', 10),
        secure: settings.mailEncryption === 'ssl',
        auth: {
          user: settings.mailUsername,
          pass: settings.mailPassword,
        },
        from: settings.mailFrom || settings.mailUsername,
        fromName: settings.mailFromName || settings.platformName || 'Admin Panel',
      };
    }
  } catch {
    // Fall through to env vars
  }

  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    fromName: process.env.EMAIL_FROM_NAME || 'Admin Panel',
  };
};

const createTransporter = async () => {
  const config = await getMailConfig();
  if (!config.auth.user || !config.auth.pass) {
    console.warn('Email credentials not configured. Set mailUsername/mailPassword in Settings or EMAIL_USER/EMAIL_PASS in .env');
    return null;
  }
  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    }),
    from: `"${config.fromName}" <${config.from || config.auth.user}>`,
  };
};

export const sendWelcomeEmail = async (email: string, name: string, username: string, password: string) => {
  const result = await createTransporter();
  if (!result) {
    console.log(`Email not sent (credentials not configured): Welcome email for ${email}`);
    return false;
  }
  const { transporter, from } = result;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Welcome to Admin Panel - Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Admin Panel</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your account has been created</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">Your account has been created. Use the credentials below to log in:</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <p style="margin: 0 0 6px; color: #888; font-size: 13px;">Email / Username</p>
              <p style="margin: 0 0 20px; color: #111; font-size: 18px; font-weight: bold;">${username}</p>
              <p style="margin: 0 0 6px; color: #888; font-size: 13px;">Password</p>
              <p style="margin: 0; color: #111; font-size: 18px; font-weight: bold; letter-spacing: 1px;">${password}</p>
            </div>

            <p style="color: #666; line-height: 1.6;">Please change your password after your first login for security purposes.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:5173'}/login"
                 style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Login to Admin Panel
              </a>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this account, please ignore this email.</p>
          </div>
        </div>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendApprovalEmail = async (email: string, name: string, itemType: string, itemName: string) => {
  const result = await createTransporter();
  if (!result) return false;
  const { transporter, from } = result;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `${itemType} Approved - Admin Panel`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Content Approved</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">Your ${itemType.toLowerCase()} <strong>"${itemName}"</strong> has been approved and is now live.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:5173'}/dashboard"
                 style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
};

export const sendRejectionEmail = async (email: string, name: string, itemType: string, itemName: string, reason: string) => {
  const result = await createTransporter();
  if (!result) return false;
  const { transporter, from } = result;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `${itemType} Rejected - Admin Panel`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Content Rejected</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">Your ${itemType.toLowerCase()} <strong>"${itemName}"</strong> has been rejected.</p>
            ${reason ? `<div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #666; font-size: 14px; font-weight: bold;">Reason:</p>
              <p style="margin: 0; color: #333;">${reason}</p>
            </div>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.ADMIN_PANEL_URL || 'http://localhost:5173'}/dashboard"
                 style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string) => {
  const result = await createTransporter();
  if (!result) return false;
  const { transporter, from } = result;

  try {
    const resetUrl = `${process.env.ADMIN_PANEL_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Password Reset Request - Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">Click the button below to reset your Admin Panel password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; line-height: 1.6;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};
