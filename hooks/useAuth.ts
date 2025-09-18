'use client'

import { useSupabase } from '@/contexts/SupabaseContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { user, userProfile, session, loading, signUp, signIn, signOut, resendConfirmation, updateProfile } = useSupabase()
  const router = useRouter()

  const isAuthenticated = !!user
  const isEmailConfirmed = userProfile?.email_confirmed || false
  const isAdmin = userProfile?.role === 'admin'
  const isModerator = userProfile?.role === 'moderator'
  const isModeratorOrAdmin = isAdmin || isModerator
  const userRole = userProfile?.role || 'user'

  // Redirect to login if not authenticated (optional)
  useEffect(() => {
    if (!loading && !isAuthenticated && window.location.pathname !== '/login') {
      // Uncomment the line below if you want automatic redirect to login
      // router.push('/login')
    }
  }, [loading, isAuthenticated, router])

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
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    updateProfile,
  }
}
