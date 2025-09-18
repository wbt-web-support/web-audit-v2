'use client'

import { useSupabase } from '@/contexts/SupabaseContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { user, session, loading, signUp, signIn, signOut } = useSupabase()
  const router = useRouter()

  const isAuthenticated = !!user
  const isAdmin = user?.user_metadata?.role === 'admin'

  // Redirect to login if not authenticated (optional)
  useEffect(() => {
    if (!loading && !isAuthenticated && window.location.pathname !== '/login') {
      // Uncomment the line below if you want automatic redirect to login
      // router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  return {
    user,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    signUp,
    signIn,
    signOut,
  }
}
