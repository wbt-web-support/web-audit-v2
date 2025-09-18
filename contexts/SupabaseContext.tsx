'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'admin' | 'moderator'
  email_confirmed: boolean
  created_at: string
}

interface AuditProject {
  id: string
  user_id: string
  site_url: string
  page_type: 'single' | 'multiple'
  brand_consistency: boolean
  hidden_urls: boolean
  keys_check: boolean
  brand_data: any | null
  hidden_urls_data: any | null
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  score: number
  issues_count: number
  created_at: string
  updated_at: string
  last_audit_at: string | null
}

interface SupabaseContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: AuthError | null; message?: string }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: AuthError | PostgrestError | null }>
  // Audit Projects CRUD operations
  createAuditProject: (projectData: Omit<AuditProject, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'>) => Promise<{ data: AuditProject | null; error: any }>
  getAuditProjects: () => Promise<{ data: AuditProject[] | null; error: any }>
  updateAuditProject: (id: string, updates: Partial<AuditProject>) => Promise<{ data: AuditProject | null; error: any }>
  deleteAuditProject: (id: string) => Promise<{ error: any }>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to test database access
  const testDatabaseAccess = async () => {
    try {
      console.log('Testing database access...')
      console.log('Supabase client:', supabase)
      console.log('Current user:', await supabase.auth.getUser())
      
      // Test 1: Try to access any table
      console.log('Test 1: Checking if we can access any table...')
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      console.log('Test 1 result:', { data: testData, error: testError })
      
      if (testError) {
        console.error('Database access test failed:', {
          message: testError.message || 'No message',
          details: testError.details || 'No details',
          hint: testError.hint || 'No hint',
          code: testError.code || 'No code',
          fullError: JSON.stringify(testError, null, 2),
          errorType: typeof testError,
          errorKeys: Object.keys(testError || {}),
          errorString: String(testError)
        })
        
        // Check for specific error types
        if (testError.code === 'PGRST301') {
          console.error('Table "users" does not exist. Please run the database setup script.')
        } else if (testError.code === '42501') {
          console.error('Permission denied. Check RLS policies.')
        } else if (testError.message?.includes('relation "users" does not exist')) {
          console.error('Table "users" does not exist. Please run the database setup script.')
        } else if (testError.message?.includes('permission denied')) {
          console.error('Permission denied. Check RLS policies and user permissions.')
        }
        
        return false
      }
      
      console.log('Database access test passed')
      return true
    } catch (error) {
      console.error('Database access test error:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      return false
    }
  }

  // Function to create user profile if it doesn't exist
  const createUserProfile = async (user: User) => {
    try {
      console.log('Creating user profile for:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      })

      // Test database access first
      const dbAccessible = await testDatabaseAccess()
      if (!dbAccessible) {
        console.warn('Database is not accessible, creating fallback profile')
        // Return a fallback profile instead of null
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: 'user' as const,
          email_confirmed: !!user.email_confirmed_at,
          created_at: user.created_at
        } as UserProfile
      }

      const profileData = {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'user',
        email_confirmed: !!user.email_confirmed_at
      }

      console.log('Profile data to insert:', profileData)

      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Database error creating user profile:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          fullError: JSON.stringify(error, null, 2)
        })
        
        // Check if it's a duplicate key error (user already exists)
        if (error.code === '23505') {
          console.log('User profile already exists, attempting to fetch it...')
          return await fetchUserProfile(user.id)
        }
        
        // If database insert fails, return fallback profile
        console.warn('Database insert failed, creating fallback profile')
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: 'user' as const,
          email_confirmed: !!user.email_confirmed_at,
          created_at: user.created_at
        } as UserProfile
      }

      console.log('User profile created successfully:', data)
      return data as UserProfile
    } catch (error) {
      console.error('Unexpected error creating user profile:', error)
      // Return fallback profile even on unexpected errors
      return {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'user' as const,
        email_confirmed: !!user.email_confirmed_at,
        created_at: user.created_at
      } as UserProfile
    }
  }

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId)
      
      // Try to fetch user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() to avoid errors when no rows found
      
      if (error) {
        console.error('Database error fetching user profile:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          fullError: JSON.stringify(error, null, 2)
        })
        
        // Check for specific error types
        if (error.code === 'PGRST301' || error.message?.includes('relation "users" does not exist')) {
          console.warn('Users table does not exist. Database setup may be required.')
        } else if (error.code === '42501') {
          console.warn('Permission denied. Check RLS policies.')
        }
        
        return null
      }
      
      if (data) {
        console.log('User profile found:', data)
        return data as UserProfile
      } else {
        console.log('No user profile found for ID:', userId)
        return null
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error)
      return null
    }
  }

  useEffect(() => {
    // Set a timeout to ensure loading state is always resolved
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false')
      setLoading(false)
    }, 3000) // 3 second timeout

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('User session found:', session.user.id)
          
          // Create a fallback profile immediately to avoid loading issues
          const fallbackProfile = {
            id: session.user.id,
            email: session.user.email || '',
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            role: 'user' as const,
            email_confirmed: !!session.user.email_confirmed_at,
            created_at: session.user.created_at
          }
          
          setUserProfile(fallbackProfile)
          
          // Try to fetch/create profile in background (non-blocking)
          setTimeout(async () => {
            try {
              let profile = await fetchUserProfile(session.user.id)
              
              if (!profile) {
                console.log('No profile found, attempting to create user profile...')
                profile = await createUserProfile(session.user)
              }
              
              if (profile) {
                console.log('Profile updated from database')
                setUserProfile(profile)
              }
            } catch (error) {
              console.log('Background profile fetch failed, using fallback')
            }
          }, 100)
        } else {
          console.log('No user session found')
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error in initial session setup:', error)
        setUserProfile(null)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Error getting initial session:', error)
      clearTimeout(loadingTimeout)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      try {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          let profile = await fetchUserProfile(session.user.id)
          
          // If profile doesn't exist, try to create one
          if (!profile) {
            console.log('No profile found, attempting to create user profile...')
            profile = await createUserProfile(session.user)
            
            if (profile) {
              console.log('User profile created successfully')
            } else {
              console.log('Failed to create user profile, using fallback profile')
              // Create a fallback profile from user data
              profile = {
                id: session.user.id,
                email: session.user.email || '',
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                role: 'user' as const,
                email_confirmed: !!session.user.email_confirmed_at,
                created_at: session.user.created_at
              }
            }
          }
          
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
        }
      }
    })
    
    if (error) {
      return { error }
    }
    
    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      return { 
        error: null, 
        message: 'Please check your email and click the confirmation link to complete your registration.' 
      }
    }
    
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    return { error }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: { message: 'No user logged in' } as any }
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      // Refresh user profile
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    }

    return { error }
  }

  // Audit Projects CRUD operations
  const createAuditProject = async (projectData: Omit<AuditProject, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('audit_projects')
        .insert({
          user_id: user.id,
          ...projectData
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating audit project:', error)
        return { data: null, error }
      }

      return { data: data as AuditProject, error: null }
    } catch (error) {
      console.error('Unexpected error creating audit project:', error)
      return { data: null, error }
    }
  }

  const getAuditProjects = async () => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('audit_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching audit projects:', error)
        return { data: null, error }
      }

      return { data: data as AuditProject[], error: null }
    } catch (error) {
      console.error('Unexpected error fetching audit projects:', error)
      return { data: null, error }
    }
  }

  const updateAuditProject = async (id: string, updates: Partial<AuditProject>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('audit_projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating audit project:', error)
        return { data: null, error }
      }

      return { data: data as AuditProject, error: null }
    } catch (error) {
      console.error('Unexpected error updating audit project:', error)
      return { data: null, error }
    }
  }

  const deleteAuditProject = async (id: string) => {
    if (!user) {
      return { error: { message: 'No user logged in' } }
    }

    try {
      const { error } = await supabase
        .from('audit_projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting audit project:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error deleting audit project:', error)
      return { error }
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    updateProfile,
    createAuditProject,
    getAuditProjects,
    updateAuditProject,
    deleteAuditProject,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
