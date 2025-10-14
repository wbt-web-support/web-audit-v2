import { useState } from 'react';

interface EmailOptions {
  type: 'welcome' | 'confirmation' | 'password-reset' | 'plan-expiry';
  email: string;
  firstName?: string;
  lastName?: string;
  confirmationUrl?: string;
  resetUrl?: string;
  planName?: string;
  expiryDate?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  message?: string;
}

export function useEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeEmail = async (
    email: string,
    firstName: string,
    lastName?: string
  ): Promise<EmailResult> => {
    return sendEmail({
      type: 'welcome',
      email,
      firstName,
      lastName,
    });
  };

  const sendConfirmationEmail = async (
    email: string,
    firstName: string,
    confirmationUrl: string
  ): Promise<EmailResult> => {
    return sendEmail({
      type: 'confirmation',
      email,
      firstName,
      confirmationUrl,
    });
  };

  const sendPasswordResetEmail = async (
    email: string,
    firstName: string,
    resetUrl: string
  ): Promise<EmailResult> => {
    return sendEmail({
      type: 'password-reset',
      email,
      firstName,
      resetUrl,
    });
  };

  const sendPlanExpiryEmail = async (
    email: string,
    firstName: string,
    planName: string,
    expiryDate: string
  ): Promise<EmailResult> => {
    return sendEmail({
      type: 'plan-expiry',
      email,
      firstName,
      planName,
      expiryDate,
    });
  };

  const testEmailConfiguration = async (email: string): Promise<EmailResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendConfirmationEmail,
    sendPasswordResetEmail,
    sendPlanExpiryEmail,
    testEmailConfiguration,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
