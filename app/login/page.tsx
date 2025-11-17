'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const { signIn, signInWithGoogle, isAuthenticated, authChecked, resendConfirmation } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();


  // Handle confirmation message from URL parameters
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authChecked, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
          setShowResendButton(true);
        } else {
          setError(error.message || "Invalid email or password");
          setShowResendButton(false);
        }
        // Don't reload the page if there's an error
      } else {
        // Reload the page after successful login with 1 second delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || "Google sign-in failed");
        setIsLoading(false);
      }
      // If successful, the user will be redirected to Google OAuth
      // and then back to the callback URL, so we don't need to handle success here
    } catch {
      setError("An unexpected error occurred during Google sign-in");
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");
    setIsRateLimited(false);

    try {
      const { error } = await resendConfirmation(email);
      
      if (error) {
        // Check if it's a rate limiting error
        if (error.message.includes('For security purposes') || error.message.includes('seconds')) {
          setError(error.message);
          setIsRateLimited(true);
        } else {
          setError(error.message || "Failed to resend confirmation email");
          setIsRateLimited(false);
        }
      } else {
        setSuccess("Confirmation email sent! Please check your inbox.");
        setShowResendButton(false);
      }
    } catch {
      setError("An unexpected error occurred while resending email");
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setError(error.message || "Failed to send password reset email");
      } else {
        setSuccess("Password reset email sent! Please check your inbox for further instructions.");
        setForgotPasswordEmail("");
        // Optionally hide the form after success
        setTimeout(() => {
          setShowForgotPassword(false);
        }, 3000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center">
      <div className="w-full h-full flex flex-col lg:flex-row">
        {/* Left Section - Branding */}
        <div 
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 75, 1, 0.12) 0%, rgba(255, 75, 1, 0.2)  50%, rgba(255, 255, 255, 0.9) 100%)'
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
              Welcome Back to
              <br />
              <span style={{ color: '#FF4B01' }}>Web Audit</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-md">
              Continue your journey to better website performance and optimization.
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

        {/* Right Section - Login Form */}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {showForgotPassword ? (
                  <>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" style={{ color: '#FF4B01' }} className="hover:opacity-80 transition-opacity font-medium">
                      Sign up
                    </Link>
                  </>
                )}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className={`mb-6 p-4 rounded-lg ${isRateLimited ? 'bg-gray-50 border border-gray-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${isRateLimited ? 'text-gray-800' : 'text-red-800'}`}>{error}</p>
                {showResendButton && !showForgotPassword && (
                  <div className="mt-3">
                    <button
                      onClick={handleResendEmail}
                      disabled={isResending}
                      style={{ color: '#FF4B01' }}
                      className="text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend Confirmation Email'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="forgotPasswordEmail"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: isSendingReset ? 1 : 1.01 }}
                  whileTap={{ scale: isSendingReset ? 1 : 0.99 }}
                  type="submit"
                  disabled={isSendingReset}
                  className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4B01] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: '#FF4B01' }}
                >
                  {isSendingReset ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setSuccess("");
                      setForgotPasswordEmail("");
                    }}
                    style={{ color: '#FF4B01' }}
                    className="text-sm hover:opacity-80 transition-opacity font-medium"
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    autoComplete="current-password"
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-2 focus:ring-[#FF4B01]"
                    style={{ accentColor: '#FF4B01' }}
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError("");
                    setSuccess("");
                  }}
                  style={{ color: '#FF4B01' }}
                  className="text-sm hover:opacity-80 transition-opacity font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
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
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
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

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Image
                    src="/google-icon-logo-svgrepo-com.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    className="w-5 h-5 mr-2"
                  />
                )}
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#FF4B01' }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
