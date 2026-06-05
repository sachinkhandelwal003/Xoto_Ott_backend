
import axios from 'axios';

interface SendOtpRequest {
  countryCode: string;
  customerId: string;
  flowType: 'SMS';
  mobileNumber: string;
}

interface SendOtpResponse {
  success: boolean;
  verificationId?: string;
  message?: string;
}

interface VerifyOtpRequest {
  verificationId: string;
  code: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
}

const MESSAGE_CENTRAL_BASE_URL = 'https://cpaas.messagecentral.com';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export class MessageCentralService {
  private authToken: string;
  private customerId: string;

  constructor() {
    this.authToken = process.env.MESSAGE_CENTRAL_AUTH_TOKEN || '';
    this.customerId = process.env.MESSAGE_CENTRAL_CUSTOMER_ID || '';
  }

  async sendOtp(mobileNumber: string, countryCode: string = '91'): Promise<SendOtpResponse> {
    // Development fallback: Generate mock OTP for testing
    if (IS_DEVELOPMENT && (!this.authToken || !this.customerId)) {
      console.log('🔧 DEV MODE: Sending mock OTP');
      const mockVerificationId = `dev-verification-${Date.now()}`;
      console.log(`Mock OTP for ${mobileNumber}: 1234`);
      return {
        success: true,
        verificationId: mockVerificationId,
        message: 'Mock OTP sent successfully! Use 1234 as OTP',
      };
    }

    try {
      const response = await axios.post(
        `${MESSAGE_CENTRAL_BASE_URL}/verification/v3/send`,
        {
          countryCode,
          customerId: this.customerId,
          flowType: 'SMS',
          mobileNumber,
        },
        {
          headers: {
            authToken: this.authToken,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Message Central send OTP response:', response.data);
      return {
        success: true,
        verificationId: response.data.verificationId,
        message: 'OTP sent successfully',
      };
    } catch (error: any) {
      console.error('❌ Message Central send OTP error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOtp(verificationId: string, code: string): Promise<VerifyOtpResponse> {
    // Development fallback: Accept any 4-digit OTP, especially 1234
    if (IS_DEVELOPMENT && (!this.authToken || !this.customerId)) {
      console.log(`🔧 DEV MODE: Verifying OTP for verification ID ${verificationId}`);
      const isValid = code === '1234' || /^\d{4}$/.test(code);
      if (isValid) {
        return {
          success: true,
          message: 'Mock OTP verified successfully!',
        };
      }
      return {
        success: false,
        message: 'Invalid OTP! In dev mode, use 1234',
      };
    }

    try {
      const response = await axios.post(
        `${MESSAGE_CENTRAL_BASE_URL}/verification/v3/validateOtp`,
        {
          verificationId,
          code,
        },
        {
          headers: {
            authToken: this.authToken,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Message Central verify OTP response:', response.data);
      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error: any) {
      console.error('❌ Message Central verify OTP error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
      };
    }
  }
}
