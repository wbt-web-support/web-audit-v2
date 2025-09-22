'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuditProject, CmsPlugin, CmsTheme, CmsComponent, Technology, PageSpeedInsightsData } from '@/types/audit'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'admin' | 'moderator'
  email_confirmed: boolean
  created_at: string
}

interface AuditProjectWithUserId extends AuditProject {
  user_id: string
  page_type: 'single' | 'multiple'
  brand_consistency: boolean
  hidden_urls: boolean
  keys_check: boolean
  brand_data: any | null
  hidden_urls_data: any | null
  pages_per_second: number
  total_response_time: number
  scraping_completed_at: string | null
  scraping_data: any | null
  pagespeed_insights_data: PageSpeedInsightsData | null
  pagespeed_insights_loading: boolean
  pagespeed_insights_error: string | null
}

interface ScrapedPage {
  id: string
  audit_project_id: string
  user_id: string
  url: string
  status_code: number | null
  title: string | null
  description: string | null
  html_content: string | null
  html_content_length: number | null
  links_count: number
  images_count: number
  meta_tags_count: number
  technologies_count: number
  technologies: string[] | null
  cms_type: string | null
  cms_version: string | null
  cms_plugins: string[] | null
  is_external: boolean
  response_time: number | null
  created_at: string
  updated_at: string
}

interface SupabaseContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  connectionError: string | null
  isConnected: boolean
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: AuthError | null; message?: string }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: AuthError | PostgrestError | null }>
  // Audit Projects CRUD operations
  createAuditProject: (projectData: Omit<AuditProjectWithUserId, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'>) => Promise<{ data: AuditProjectWithUserId | null; error: any }>
  getAuditProject: (id: string) => Promise<{ data: AuditProjectWithUserId | null; error: any }>
  getAuditProjects: () => Promise<{ data: AuditProjectWithUserId[] | null; error: any }>
  getAuditProjectsOptimized: () => Promise<{ data: AuditProject[] | null; error: any }>
  updateAuditProject: (id: string, updates: Partial<AuditProjectWithUserId>) => Promise<{ data: AuditProjectWithUserId | null; error: any }>
  deleteAuditProject: (id: string) => Promise<{ error: any }>
  // Scraped Pages CRUD operations
  createScrapedPage: (pageData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ data: ScrapedPage | null; error: any }>
  getScrapedPages: (auditProjectId: string) => Promise<{ data: ScrapedPage[] | null; error: any }>
  updateScrapedPage: (id: string, updates: Partial<ScrapedPage>) => Promise<{ data: ScrapedPage | null; error: any }>
  deleteScrapedPage: (id: string) => Promise<{ data: ScrapedPage | null; error: any }>
  // Bulk operations
  createScrapedPages: (pagesData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => Promise<{ data: ScrapedPage[] | null; error: any }>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Connection retry mechanism
  const retryConnection = async (retries = 3, delay = 1000): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Connection attempt ${i + 1}/${retries}`)
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (!error) {
          console.log('✅ Database connection successful')
          setIsConnected(true)
          setConnectionError(null)
          return true
        }
        
        console.warn(`Connection attempt ${i + 1} failed:`, error.message)
        
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      } catch (error) {
        console.warn(`Connection attempt ${i + 1} failed with error:`, error)
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }
    
    console.error('❌ All connection attempts failed')
    setIsConnected(false)
    setConnectionError('Unable to connect to database after multiple attempts')
    return false
  }

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
        console.error('Database access test failed:', testError)
        const connected = await retryConnection()
        if (!connected) {
          throw new Error(`Database connection failed: ${testError.message}`)
        }
      } else {
        setIsConnected(true)
        setConnectionError(null)
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
    let isMounted = true
    let loadingTimeout: NodeJS.Timeout
    
    const initializeConnection = async () => {
      try {
        console.log('🔄 Initializing Supabase connection...')
        
        // Test database connection first
        const connectionTest = await testDatabaseAccess()
        if (!connectionTest && isMounted) {
          console.warn('⚠️ Database connection test failed, but continuing with auth...')
        }
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError && isMounted) {
          console.error('Session error:', sessionError)
          setConnectionError(sessionError.message)
        }
        
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('✅ User session found:', session.user.id)
            
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
            if (isConnected) {
              setTimeout(async () => {
                if (!isMounted) return
                
                try {
                  let profile = await fetchUserProfile(session.user.id)
                  
                  if (!profile) {
                    console.log('No profile found, attempting to create user profile...')
                    profile = await createUserProfile(session.user)
                  }
                  
                  if (profile && isMounted) {
                    console.log('Profile updated from database')
                    setUserProfile(profile)
                  }
                } catch (error) {
                  console.log('Background profile fetch failed, using fallback')
                }
              }, 100)
            }
          } else {
            console.log('No user session found')
            setUserProfile(null)
          }
        }
      } catch (error) {
        console.error('Error in connection initialization:', error)
        if (isMounted) {
          setConnectionError(error instanceof Error ? error.message : 'Unknown connection error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    // Set a timeout to ensure loading state is always resolved
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('Loading timeout reached, setting loading to false')
        setLoading(false)
      }
    }, 5000) // Increased to 5 seconds
    
    // Initialize connection
    initializeConnection()
    
    // Cleanup function
    return () => {
      isMounted = false
      clearTimeout(loadingTimeout)
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('Auth state change:', event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Test connection when auth state changes
        const connected = await retryConnection(2, 500)
        if (connected) {
          // Fetch profile if connected
          try {
            let profile = await fetchUserProfile(session.user.id)
            if (!profile) {
              profile = await createUserProfile(session.user)
            }
            if (profile && isMounted) {
              setUserProfile(profile)
            }
          } catch (error) {
            console.log('Profile fetch failed during auth change')
          }
        }
      } else {
        setUserProfile(null)
      }
    })
    
    return () => {
      isMounted = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
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
  const createAuditProject = async (projectData: Omit<AuditProjectWithUserId, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'>) => {
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

      return { data: data as AuditProjectWithUserId, error: null }
    } catch (error) {
      console.error('Unexpected error creating audit project:', error)
      return { data: null, error }
    }
  }

  const getAuditProject = async (id: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('audit_projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching audit project:', error)
        return { data: null, error }
      }

      return { data: data as AuditProjectWithUserId, error: null }
    } catch (error) {
      console.error('Unexpected error fetching audit project:', error)
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

      return { data: data as AuditProjectWithUserId[], error: null }
    } catch (error) {
      console.error('Unexpected error fetching audit projects:', error)
      return { data: null, error }
    }
  }

  // Optimized query that only fetches required columns for dashboard components
    const getAuditProjectsOptimized = async () => {
      if (!user) {
        return { data: null, error: { message: 'No user logged in' } }
      }

      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('❌ SupabaseContext: Missing environment variables')
        return { 
          data: null, 
          error: { 
            message: 'Supabase not configured. Please create a .env.local file with your Supabase credentials.' 
          } 
        }
      }

      const queryStartTime = performance.now()
      console.log('🔍 SupabaseContext: Starting optimized query for user:', user.id)

      try {
        const { data, error } = await supabase
          .from('audit_projects')
          .select(`
            id,
            site_url,
            status,
            progress,
            last_audit_at,
            issues_count,
            score,
            created_at,
            updated_at,
            total_pages,
            total_links,
            total_images,
            total_meta_tags,
            technologies_found,
            cms_detected,
            cms_type,
            cms_version,
            cms_plugins,
            cms_themes,
            cms_components,
            cms_confidence,
            cms_detection_method,
            cms_metadata,
            technologies,
            technologies_confidence,
            technologies_detection_method,
            technologies_metadata,
            total_html_content,
            average_html_per_page,
            pagespeed_insights_data,
            pagespeed_insights_loading,
            pagespeed_insights_error,
            seo_analysis
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const queryEndTime = performance.now()
        const queryTime = queryEndTime - queryStartTime

        if (error) {
          console.error('❌ SupabaseContext: Query error after', queryTime.toFixed(2), 'ms:', error)
          return { data: null, error }
        }

        console.log(`✅ SupabaseContext: Query completed in ${queryTime.toFixed(2)}ms`)
        console.log(`📊 SupabaseContext: Retrieved ${data?.length || 0} projects`)
        
        if (data && data.length > 0) {
          const dataSize = JSON.stringify(data).length
          console.log(`📦 SupabaseContext: Data size: ${(dataSize / 1024).toFixed(2)}KB`)
        }

        return { data: data as AuditProject[], error: null }
      } catch (error) {
        const queryEndTime = performance.now()
        const queryTime = queryEndTime - queryStartTime
        console.error('❌ SupabaseContext: Unexpected error after', queryTime.toFixed(2), 'ms:', error)
        return { data: null, error }
      }
    }

  const updateAuditProject = async (id: string, updates: Partial<AuditProjectWithUserId>) => {
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
        console.error('Error details:', JSON.stringify(error, null, 2))
        return { data: null, error }
      }

      return { data: data as AuditProjectWithUserId, error: null }
    } catch (error) {
      console.error('Unexpected error updating audit project:', error)
      console.error('Unexpected error details:', JSON.stringify(error, null, 2))
      return { data: null, error: error instanceof Error ? error : { message: 'Unknown error occurred' } }
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

  // Scraped Pages CRUD operations
  const createScrapedPage = async (pageData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('scraped_pages')
        .insert({
          user_id: user.id,
          ...pageData
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating scraped page:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error creating scraped page:', error)
      return { data: null, error }
    }
  }

  const getScrapedPages = async (auditProjectId: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('audit_project_id', auditProjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching scraped pages:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching scraped pages:', error)
      return { data: null, error }
    }
  }

  const updateScrapedPage = async (id: string, updates: Partial<ScrapedPage>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('scraped_pages')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating scraped page:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating scraped page:', error)
      return { data: null, error }
    }
  }

  const deleteScrapedPage = async (id: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('scraped_pages')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error deleting scraped page:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error deleting scraped page:', error)
      return { data: null, error }
    }
  }

  const createScrapedPages = async (pagesData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const pagesWithUserId = pagesData.map(page => ({
        ...page,
        user_id: user.id
      }))

      const { data, error } = await supabase
        .from('scraped_pages')
        .insert(pagesWithUserId)
        .select()

      if (error) {
        console.error('Error creating scraped pages:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error creating scraped pages:', error)
      return { data: null, error }
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    connectionError,
    isConnected,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    updateProfile,
    createAuditProject,
    getAuditProject,
    getAuditProjects,
    getAuditProjectsOptimized,
    updateAuditProject,
    deleteAuditProject,
    createScrapedPage,
    getScrapedPages,
    updateScrapedPage,
    deleteScrapedPage,
    createScrapedPages,
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
