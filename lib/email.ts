import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    const config: EmailConfig = {
      host: process.env.MAIL_HOST || 'smtp.eu.mailgun.org',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: false,
      // Use TLS, not SSL
      auth: {
        user: process.env.MAIL_USERNAME || '',
        pass: process.env.MAIL_PASSWORD || ''
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    this.transporter = nodemailer.createTransport(config);
  }

  // Verify SMTP connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }

  // Send email method
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Web Audit Pro',
          address: process.env.MAIL_FROM_ADDRESS || 'leads@mg.quotebuilderpro.com'
        },
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Strip HTML tags for text version
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Send welcome email after signup
  async sendWelcomeEmail(email: string, firstName: string, lastName: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const template = this.getWelcomeTemplate(firstName, lastName);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  // Send email confirmation reminder
  async sendConfirmationReminder(email: string, firstName: string, confirmationUrl: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const template = this.getConfirmationTemplate(firstName, confirmationUrl);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const template = this.getPasswordResetTemplate(firstName, resetUrl);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  // Send plan expiry notification
  async sendPlanExpiryNotification(email: string, firstName: string, planName: string, expiryDate: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const template = this.getPlanExpiryTemplate(firstName, planName, expiryDate);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  // Send custom email with provided content
  async sendCustomEmail(email: string, subject: string, html: string, text: string = ''): Promise<{
    success: boolean;
    error?: string;
  }> {
    return this.sendEmail(email, subject, html, text);
  }

  // Welcome email template
  private getWelcomeTemplate(firstName: string, lastName: string): EmailTemplate {
    const fullName = `${firstName} ${lastName}`.trim();
    return {
      subject: 'Welcome to Web Audit Pro! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Web Audit Pro</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Web Audit Pro! 🎉</h1>
            <p>Your journey to better website performance starts here</p>
          </div>
          
          <div class="content">
            <h2>Hi ${fullName},</h2>
            <p>Welcome to Web Audit Pro! We're thrilled to have you on board. You've just taken the first step towards optimizing your website's performance and SEO.</p>
            
            <h3>What you can do now:</h3>
            <div class="feature">
              <strong>🚀 Run Your First Audit</strong><br>
              Start by analyzing your website's performance, SEO, and accessibility.
            </div>
            <div class="feature">
              <strong>📊 Get Detailed Reports</strong><br>
              Receive comprehensive insights with actionable recommendations.
            </div>
            <div class="feature">
              <strong>🔧 Track Improvements</strong><br>
              Monitor your progress over time with our analytics dashboard.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
                Go to Dashboard
              </a>
            </div>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The Web Audit Pro Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Web Audit Pro. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Web Audit Pro! Hi ${fullName}, Welcome to Web Audit Pro! We're thrilled to have you on board. You've just taken the first step towards optimizing your website's performance and SEO. What you can do now: 🚀 Run Your First Audit - Start by analyzing your website's performance, SEO, and accessibility. 📊 Get Detailed Reports - Receive comprehensive insights with actionable recommendations. 🔧 Track Improvements - Monitor your progress over time with our analytics dashboard. Go to Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard If you have any questions or need help getting started, don't hesitate to reach out to our support team. Best regards, The Web Audit Pro Team`
    };
  }

  // Email confirmation template
  private getConfirmationTemplate(firstName: string, confirmationUrl: string): EmailTemplate {
    return {
      subject: 'Please confirm your email address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Confirm Your Email Address</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for signing up for Web Audit Pro! To complete your registration, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" class="button">
                Confirm Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">${confirmationUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
            
            <p>Best regards,<br>The Web Audit Pro Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Web Audit Pro. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `Confirm Your Email Address. Hi ${firstName}, Thank you for signing up for Web Audit Pro! To complete your registration, please confirm your email address by visiting this link: ${confirmationUrl} This link will expire in 24 hours for security reasons. If you didn't create an account with us, please ignore this email. Best regards, The Web Audit Pro Team`
    };
  }

  // Password reset template
  private getPasswordResetTemplate(firstName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your password for your Web Audit Pro account. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The Web Audit Pro Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Web Audit Pro. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `Reset Your Password. Hi ${firstName}, We received a request to reset your password for your Web Audit Pro account. Visit this link to set a new password: ${resetUrl} This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email. Your password will remain unchanged. Best regards, The Web Audit Pro Team`
    };
  }

  // Plan expiry template
  private getPlanExpiryTemplate(firstName: string, planName: string, expiryDate: string): EmailTemplate {
    return {
      subject: `Your ${planName} plan expires soon`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Plan Expiry Notification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Plan Expiry Notice</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>This is a friendly reminder that your <strong>${planName}</strong> plan will expire on <strong>${expiryDate}</strong>.</p>
            
            <p>To continue enjoying all the features of Web Audit Pro, please renew your subscription before the expiry date.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">
                Renew Subscription
              </a>
            </div>
            
            <p>If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Web Audit Pro Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Web Audit Pro. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `Plan Expiry Notice. Hi ${firstName}, This is a friendly reminder that your ${planName} plan will expire on ${expiryDate}. To continue enjoying all the features of Web Audit Pro, please renew your subscription before the expiry date. Renew Subscription: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team. Best regards, The Web Audit Pro Team`
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();