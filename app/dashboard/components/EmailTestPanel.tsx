'use client';

import { useState } from 'react';
import { useEmail } from '@/hooks/useEmail';

export default function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState('');
  const [emailType, setEmailType] = useState<'welcome' | 'confirmation' | 'password-reset' | 'plan-expiry'>('welcome');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmationUrl, setConfirmationUrl] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [planName, setPlanName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  const {
    sendEmail,
    testEmailConfiguration,
    isLoading,
    error,
    clearError
  } = useEmail();

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    const result = await testEmailConfiguration(testEmail);
    if (result.success) {
      alert('Test email sent successfully!');
    } else {
      alert(`Failed to send test email: ${result.error}`);
    }
  };

  const handleSendEmail = async () => {
    if (!testEmail || !firstName) {
      alert('Please fill in required fields');
      return;
    }

    const options: any = {
      type: emailType,
      email: testEmail,
      firstName,
    };

    if (lastName) options.lastName = lastName;
    if (confirmationUrl) options.confirmationUrl = confirmationUrl;
    if (resetUrl) options.resetUrl = resetUrl;
    if (planName) options.planName = planName;
    if (expiryDate) options.expiryDate = expiryDate;

    const result = await sendEmail(options);
    if (result.success) {
      alert('Email sent successfully!');
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Email Test Panel</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email address"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleTestEmail}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>

        <hr className="my-6" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Type
          </label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="welcome">Welcome Email</option>
            <option value="confirmation">Confirmation Email</option>
            <option value="password-reset">Password Reset Email</option>
            <option value="plan-expiry">Plan Expiry Email</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Last name"
            />
          </div>
        </div>

        {emailType === 'confirmation' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmation URL
            </label>
            <input
              type="url"
              value={confirmationUrl}
              onChange={(e) => setConfirmationUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/confirm?token=..."
            />
          </div>
        )}

        {emailType === 'password-reset' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reset URL
            </label>
            <input
              type="url"
              value={resetUrl}
              onChange={(e) => setResetUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/reset?token=..."
            />
          </div>
        )}

        {emailType === 'plan-expiry' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pro Plan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSendEmail}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  );
}
