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
    console.log('🔍 useAuth useEffect - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email);
    
    if (!loading) {
      setAuthChecked(true)
      
      // Handle authentication state changes
      if (isAuthenticated) {
        console.log('✅ User authenticated:', user?.email)
        
        // Redirect to dashboard if on login page
        if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
          console.log('🔄 Redirecting authenticated user to dashboard from:', window.location.pathname)
          // Small delay to ensure auth state is fully updated
          setTimeout(() => {
            console.log('🚀 Executing redirect to dashboard')
            router.push('/dashboard')
          }, 100)
        }
      } else {
        console.log('❌ User not authenticated')
        
        // Redirect to login if on protected routes (optional)
        const protectedRoutes = ['/dashboard', '/profile', '/admin']
        const currentPath = window.location.pathname
        
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          console.log('🔄 Redirecting unauthenticated user to login from:', currentPath)
          router.push('/login')
        }
      }
    }
  }, [loading, isAuthenticated, user, router])

  // Enhanced logout with proper cleanup
  const handleSignOut = async () => {
    try {
      console.log('🚪 Logging out user...')
      const { error } = await signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
        return { error }
      }
      
      // Clear any cached data
      setAuthChecked(false)
      
      // Redirect to home page after logout
      router.push('/')
      
      console.log('✅ Logout successful')
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
