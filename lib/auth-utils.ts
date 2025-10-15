import { supabase } from './supabase-client';

/**
 * Handles authentication errors by logging out the user and clearing session
 * @param error - The error object that occurred
 * @param context - Optional context string for logging
 */
export async function handleAuthError(error: any, context?: string): Promise<boolean> {
  // Check if it's an authentication error
  const isAuthError = error?.message?.includes('User not authenticated') ||
    error?.message?.includes('User from sub claim in JWT does not exist') ||
    error?.message?.includes('JWT expired') ||
    error?.message?.includes('Invalid JWT') ||
    error?.message?.includes('AuthApiError');

  if (isAuthError) {
    console.warn(`Authentication error detected${context ? ` in ${context}` : ''}:`, error);
    
    try {
      // Clear session and logout user
      await supabase.auth.signOut();
      
      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reload page to reset app state
      window.location.href = '/login';
      
      return true; // Indicates that logout was performed
    } catch (logoutError) {
      console.error('Error during logout:', logoutError);
      // Force redirect even if logout fails
      window.location.href = '/login';
      return true;
    }
  }
  
  return false; // No logout was performed
}

/**
 * Wraps a function with automatic authentication error handling
 * @param fn - The function to wrap
 * @param context - Optional context for logging
 */
export function withAuthErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const wasLoggedOut = await handleAuthError(error, context);
      if (wasLoggedOut) {
        // Don't re-throw if user was logged out
        return;
      }
      throw error;
    }
  }) as T;
}
