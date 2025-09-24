'use client'

import { useSupabase } from '@/contexts/SupabaseContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAuth() {
  const { user, userProfile, session, loading, signUp, signIn, signOut, resendConfirmation, updateProfile } = useSupabase()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  const isAuthenticated = !!user
  const isEmailConfirmed = userProfile?.email_confirmed || false
  const isAdmin = userProfile?.role === 'admin'
  const isModerator = userProfile?.role === 'moderator'
  const isModeratorOrAdmin = isAdmin || isModerator
  const userRole = userProfile?.role || 'user'

  // Enhanced authentication checking with proper state management
  useEffect(() => {
    
    
    if (!loading) {
      setAuthChecked(true)
      
      // Handle authentication state changes
      if (isAuthenticated) {
        
        
        // Redirect to dashboard if on login page
        if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
          
          // Small delay to ensure auth state is fully updated
          setTimeout(() => {
            
            router.push('/dashboard')
          }, 100)
        }
      } else {
        
        
        // Redirect to login if on protected routes (optional)
        const protectedRoutes = ['/dashboard', '/profile', '/admin']
        const currentPath = window.location.pathname
        
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          
          router.push('/login')
        }
      }
    }
  }, [loading, isAuthenticated, user, router])

  // Enhanced logout with proper cleanup
  const handleSignOut = async () => {
    try {
      
      const { error } = await signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
        return { error }
      }
      
      // Clear any cached data
      setAuthChecked(false)
      
      // Redirect to home page after logout
      router.push('/')
      
      
      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected logout error:', error)
      return { error: error as any }
    }
  }

  // Monitor authentication state changes
  useEffect(() => {
    if (authChecked) {
      console.log('🔍 Auth state:', {
        isAuthenticated,
        isEmailConfirmed,
        userRole,
        loading
      })
    }
  }, [authChecked, isAuthenticated, isEmailConfirmed, userRole, loading])

  return {
    user,
    userProfile,
    session,
    loading,
    isAuthenticated,
    isEmailConfirmed,
    isAdmin,
    isModerator,
    isModeratorOrAdmin,
    userRole,
    authChecked,
    signUp,
    signIn,
    signOut: handleSignOut,
    resendConfirmation,
    updateProfile,
  }
}
