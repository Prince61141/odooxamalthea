const nodemailer = require('nodemailer');

// Simple cached mail client (transporter + metadata)
let mailClient = null;

async function getMailClient() {
  if (mailClient) return mailClient;
  
  // Use SMTP if configured
  if (process.env.SMTP_HOST && process.env.EMAIL_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: (process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    mailClient = { transporter, ethereal: false };
    return mailClient;
  }

  // Fallback to Ethereal for testing
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  mailClient = { transporter, ethereal: true, testAccount };
  return mailClient;
}

async function sendPasswordResetEmail(email, name, resetUrl) {
  try {
    const mail = await getMailClient();
    const transporter = mail.transporter;

    const from = process.env.FROM_EMAIL || `${process.env.APP_NAME || 'ExpenseApp'} <no-reply@example.com>`;
    const appName = process.env.APP_NAME || 'Expense Manager';

    const text = `Hello ${name},

You recently requested to reset your password for your ${appName} account. Click the link below to reset it:

${resetUrl}

This password reset link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Thanks,
The ${appName} Team`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                🔐 Password Reset
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
                                Hello ${name},
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                You recently requested to reset your password for your <strong>${appName}</strong> account. Click the button below to reset it.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; 
                                                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                                  color: #ffffff; 
                                                  font-size: 16px; 
                                                  font-weight: 600; 
                                                  text-decoration: none; 
                                                  padding: 14px 40px; 
                                                  border-radius: 8px; 
                                                  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
                                                  transition: transform 0.2s;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:
                            </p>
                            
                            <div style="background-color: #f9fafb; 
                                        border: 1px solid #e5e7eb; 
                                        border-radius: 6px; 
                                        padding: 12px 16px; 
                                        margin-bottom: 30px;
                                        word-break: break-all;">
                                <a href="${resetUrl}" 
                                   style="color: #4f46e5; 
                                          text-decoration: none; 
                                          font-size: 14px;">
                                    ${resetUrl}
                                </a>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background-color: #fef3c7; 
                                        border-left: 4px solid #f59e0b; 
                                        padding: 16px 20px; 
                                        margin-bottom: 20px;
                                        border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    ⏰ <strong>Security Notice:</strong> This password reset link will expire in <strong>1 hour</strong> for your security.
                                </p>
                            </div>
                            
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If you did not request a password reset, please ignore this email or contact our support team if you have concerns.
                            </p>
                            
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Your account security is important to us.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; 
                                   padding: 30px; 
                                   text-align: center; 
                                   border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px; font-weight: 600;">
                                Thanks,
                            </p>
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px;">
                                The ${appName} Team
                            </p>
                            
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                This is an automated message, please do not reply to this email.<br>
                                © ${new Date().getFullYear()} ${appName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `${appName} - Reset Your Password`,
      text,
      html
    });

    // Return preview URL if using Ethereal
    if (mail.ethereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Password reset email preview:', previewUrl);
      return { success: true, previewUrl };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

module.exports = {
  getMailClient,
  sendPasswordResetEmail
};
