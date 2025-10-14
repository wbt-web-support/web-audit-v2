import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, firstName, lastName, confirmationUrl, resetUrl, planName, expiryDate, to, subject, html, text } = body;

    if (!email && !to) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    let result;

    // Handle custom template content
    if (to && subject && html) {
      result = await emailService.sendCustomEmail(to, subject, html, text || '');
    } else {
      // Handle predefined email types
      const emailAddress = email || to;
      
      switch (type) {
        case 'welcome':
          if (!firstName) {
            return NextResponse.json(
              { success: false, error: 'First name is required for welcome email' },
              { status: 400 }
            );
          }
          result = await emailService.sendWelcomeEmail(emailAddress, firstName, lastName || '');
          break;

        case 'confirmation':
          if (!firstName || !confirmationUrl) {
            return NextResponse.json(
              { success: false, error: 'First name and confirmation URL are required' },
              { status: 400 }
            );
          }
          result = await emailService.sendConfirmationReminder(emailAddress, firstName, confirmationUrl);
          break;

        case 'password-reset':
          if (!firstName || !resetUrl) {
            return NextResponse.json(
              { success: false, error: 'First name and reset URL are required' },
              { status: 400 }
            );
          }
          result = await emailService.sendPasswordResetEmail(emailAddress, firstName, resetUrl);
          break;

        case 'plan-expiry':
          if (!firstName || !planName || !expiryDate) {
            return NextResponse.json(
              { success: false, error: 'First name, plan name, and expiry date are required' },
              { status: 400 }
            );
          }
          result = await emailService.sendPlanExpiryNotification(emailAddress, firstName, planName, expiryDate);
          break;

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid email type' },
            { status: 400 }
          );
      }
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
