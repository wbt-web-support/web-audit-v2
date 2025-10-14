import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Test SMTP connection first
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'SMTP connection failed' },
        { status: 500 }
      );
    }

    // Send test email
    const result = await emailService.sendEmail(
      email,
      'Test Email from Web Audit Pro',
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Email Configuration Test</h1>
          </div>
          
          <div class="content">
            <h2>Congratulations!</h2>
            <p>Your email configuration is working correctly. This is a test email from Web Audit Pro.</p>
            
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>SMTP Host: ${process.env.MAIL_HOST}</li>
              <li>SMTP Port: ${process.env.MAIL_PORT}</li>
              <li>Encryption: ${process.env.MAIL_ENCRYPTION}</li>
              <li>From Address: ${process.env.MAIL_FROM_ADDRESS}</li>
            </ul>
            
            <p>You can now send emails to your users for signup confirmations, password resets, and other notifications.</p>
            
            <p>Best regards,<br>The Web Audit Pro Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Web Audit Pro. All rights reserved.</p>
            <p>This is a test email sent to ${email}</p>
          </div>
        </body>
        </html>
      `,
      'Email Configuration Test - Your email configuration is working correctly. This is a test email from Web Audit Pro. Configuration Details: SMTP Host: ' + process.env.MAIL_HOST + ', SMTP Port: ' + process.env.MAIL_PORT + ', Encryption: ' + process.env.MAIL_ENCRYPTION + ', From Address: ' + process.env.MAIL_FROM_ADDRESS + '. You can now send emails to your users for signup confirmations, password resets, and other notifications. Best regards, The Web Audit Pro Team'
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully',
        details: {
          smtpHost: process.env.MAIL_HOST,
          smtpPort: process.env.MAIL_PORT,
          encryption: process.env.MAIL_ENCRYPTION,
          fromAddress: process.env.MAIL_FROM_ADDRESS
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
