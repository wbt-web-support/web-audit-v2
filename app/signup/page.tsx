'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);

  const { signUp, signInWithGoogle, resendConfirmation } = useAuth();
  const router = useRouter();
  // Redirect is handled by useAuth hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validation
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError("Please agree to the Terms & Conditions");
      setIsLoading(false);
      return;
    }

    try {
      const { error, message } = await signUp(email, password, firstName, lastName);
      
      if (error) {
        setError(error.message || "An error occurred during signup");
      } else {
        setSuccess(message || "Account created successfully!");
        setShowConfirmationMessage(true);
        // Clear form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setRepeatPassword("");
        setAgreeToTerms(false);
        
        // Redirect to login page with confirmation message after a short delay
        setTimeout(() => {
          router.push('/login?message=Please check your email and click the confirmation link to complete your registration.');
        }, 2000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await resendConfirmation(email);
      if (error) {
        setError(error.message || "Failed to resend confirmation email");
      } else {
        setSuccess("Confirmation email sent! Please check your inbox.");
      }
    } catch {
      setError("Failed to resend confirmation email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || "Google sign-up failed");
        setIsLoading(false);
      }
      // If successful, the user will be redirected to Google OAuth
      // and then back to the callback URL, so we don't need to handle success here
    } catch {
      setError("An unexpected error occurred during Google sign-up");
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center">
      <div className="w-full h-full flex flex-col lg:flex-row">
        {/* Left Section - Branding */}
        <div 
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 75, 1, 0.12) 0%, rgba(255, 75, 1, 0.2) 50%, rgba(255, 255, 255, 0.9) 100%)'
          }}
        >
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/orange-black-auditly.png"
              alt="Auditly360"
              width={124}
              height={43}
              className="h-8 w-auto"
              priority
            />
          </div>

          {/* Tagline */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight text-gray-900">
              Start Your Journey
              <br />
              <span style={{ color: '#FF4B01' }}>to Better Websites</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-md">
              Join thousands of developers and businesses who trust Web Audit for comprehensive website analysis and optimization.
            </p>
          </div>

          {/* Back to website */}
          <div>
            <Link 
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              ← Back to website
            </Link>
          </div>
        </div>

        {/* Right Section - Signup Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-16">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden mb-6 w-full">
              <div className="flex items-center justify-between mb-6">
                <Link 
                  href="/"
                  className="text-gray-700 hover:text-gray-900 transition-colors text-sm"
                >
                  ← Back
                </Link>
              </div>
              <div className="flex ">
                <Image
                  src="/orange-black-auditly.png"
                  alt="Auditly360"
                  width={124}
                  height={43}
                  className="h-8 w-auto"
                  priority
                />
              </div>
            </div>

            {/* Header */}
            <div className="mb-8 lg:mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Create an account</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#FF4B01' }} className="hover:opacity-80 transition-opacity font-medium">
                  Log in
                </Link>
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Email Confirmation Message */}
            {showConfirmationMessage && (
              <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleResendConfirmation}
                      disabled={isLoading}
                      style={{ color: '#FF4B01' }}
                      className="text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {isLoading ? 'Sending...' : 'Resend confirmation email'}
                    </button>
                    <p className="text-xs text-gray-500">
                      Didn&apos;t receive the email? Check your spam folder.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:border-transparent transition-all"
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:border-transparent transition-all"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:border-transparent transition-all"
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:border-transparent transition-all pr-12"
                    placeholder="Password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Repeat Password Field */}
              <div>
                <label htmlFor="repeatPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showRepeatPassword ? "text" : "password"}
                    id="repeatPassword"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:border-transparent transition-all pr-12"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showRepeatPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-2 focus:ring-[#FF4B01] mt-1"
                  style={{ accentColor: '#FF4B01' }}
                  required
                />
                <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="#" style={{ color: '#FF4B01' }} className="hover:opacity-80 transition-opacity font-medium">
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              {/* Create Account Button */}
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#FF4B01' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isLoading ? 'Signing up...' : 'Continue with Google'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
