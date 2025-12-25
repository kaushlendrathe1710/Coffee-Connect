import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Coffee Date" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Your Coffee Date Login Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #6F4E37; font-size: 28px; margin: 0;">Coffee Date</h1>
            <p style="color: #8B7355; font-size: 14px; margin-top: 8px;">Your next coffee date awaits</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #FFF8F0 0%, #F5E6D3 100%); border-radius: 16px; padding: 32px; text-align: center;">
            <p style="color: #4A3728; font-size: 16px; margin: 0 0 24px 0;">
              Enter this code to sign in to Coffee Date:
            </p>
            
            <div style="background: #FFFFFF; border-radius: 12px; padding: 20px 32px; display: inline-block; box-shadow: 0 2px 8px rgba(111, 78, 55, 0.1);">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6F4E37;">${otp}</span>
            </div>
            
            <p style="color: #8B7355; font-size: 14px; margin: 24px 0 0 0;">
              This code expires in 10 minutes
            </p>
          </div>
          
          <p style="color: #A89583; font-size: 12px; text-align: center; margin-top: 32px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Your Coffee Date login code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
