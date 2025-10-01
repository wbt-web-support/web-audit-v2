'use client';

import { useSupabase } from '@/contexts/SupabaseContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
export function useAuth() {
  const {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resendConfirmation,
    updateProfile
  } = useSupabase();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const isAuthenticated = !!user;
  const isEmailConfirmed = userProfile?.email_confirmed || false;
  const isAdmin = userProfile?.role === 'admin';
  const isAdminUser = isAdmin;
  const userRole = userProfile?.role || 'user';

  // Enhanced authentication checking with proper state management
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);

      // Handle authentication state changes
      if (isAuthenticated) {
        // Redirect to dashboard if on login page or signup page
        if ((window.location.pathname === '/login' || window.location.pathname === '/signup') && !redirecting) {
          setRedirecting(true);

          // Small delay to ensure auth state is fully updated
          setTimeout(() => {
            router.push('/dashboard');
          }, 100);
        }
      } else {
        setRedirecting(false); // Reset redirecting flag when not authenticated

        // Only redirect to login if we're on protected routes AND not already on login/signup
        const protectedRoutes = ['/dashboard', '/profile', '/admin'];
        const currentPath = window.location.pathname;
        if (protectedRoutes.some(route => currentPath.startsWith(route)) && currentPath !== '/login' && currentPath !== '/signup') {
          router.push('/login');
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Enhanced logout with proper cleanup
  const handleSignOut = async () => {
    try {
      const {
        error
      } = await signOut();
      if (error) {
        console.error('❌ Logout error:', error);
        return {
          error
        };
      }

      // Clear any cached data
      setAuthChecked(false);

      // Redirect to home page after logout
      router.push('/');
      return {
        error: null
      };
    } catch (error) {
      console.error('❌ Unexpected logout error:', error);
      return {
        error: error as any
      };
    }
  };

  // Monitor authentication state changes
  useEffect(() => {
    if (authChecked) {}
  }, [authChecked, isAuthenticated, isEmailConfirmed, userRole, loading]);
  return {
    user,
    userProfile,
    session,
    loading,
    isAuthenticated,
    isEmailConfirmed,
    isAdmin,
    isAdminUser,
    userRole,
    authChecked,
    signUp,
    signIn,
    signInWithGoogle,
    signOut: handleSignOut,
    resendConfirmation,
    updateProfile
  };
}