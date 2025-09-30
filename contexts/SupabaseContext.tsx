'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuditProject, CmsPlugin, CmsTheme, CmsComponent, Technology, PageSpeedInsightsData, MetaTagsData, SocialMetaTagsData } from '@/types/audit'

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
  meta_tags_data: MetaTagsData | null
  social_meta_tags_data: SocialMetaTagsData | null
  // HTML content storage for all pages
  all_pages_html: any[] | null
  // Images and links data storage
  images: any[] | null // Store aggregated images data from all pages
  links: any[] | null // Store aggregated links data from all pages
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
  links: any[] | null // Store actual links data
  images: any[] | null // Store actual images data
  meta_tags_count: number
  technologies_count: number
  technologies: string[] | null
  cms_type: string | null
  cms_version: string | null
  cms_plugins: string[] | null
  social_meta_tags: any | null
  social_meta_tags_count: number
  is_external: boolean
  response_time: number | null
  performance_analysis: any | null // Store PageSpeed Insights analysis results
  created_at: string
  updated_at: string
}

interface Ticket {
  id: string
  user_id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  assigned_to: string | null
  resolved_at: string | null
  closed_at: string | null
}

interface TicketMessage {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_from_support: boolean
  created_at: string
  updated_at: string
}

interface TicketWithMessages extends Ticket {
  messages: TicketMessage[]
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
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
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
  getScrapedPage: (id: string) => Promise<{ data: ScrapedPage | null; error: any }>
  updateScrapedPage: (id: string, updates: Partial<ScrapedPage>) => Promise<{ data: ScrapedPage | null; error: any }>
  deleteScrapedPage: (id: string) => Promise<{ data: ScrapedPage | null; error: any }>
  // Bulk operations
  createScrapedPages: (pagesData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => Promise<{ data: ScrapedPage[] | null; error: any }>
  // Meta tags processing
  processMetaTagsData: (auditProjectId: string) => Promise<{ data: AuditProjectWithUserId | null; error: any }>
  // Manual trigger for existing projects
  triggerMetaTagsProcessing: (auditProjectId: string) => Promise<{ success: boolean; error?: any }>
  // Ticket System CRUD operations
  createTicket: (ticketData: Omit<Ticket, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'resolved_at' | 'closed_at'>) => Promise<{ data: Ticket | null; error: any }>
  getTickets: () => Promise<{ data: Ticket[] | null; error: any }>
  getTicket: (id: string) => Promise<{ data: TicketWithMessages | null; error: any }>
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<{ data: Ticket | null; error: any }>
  deleteTicket: (id: string) => Promise<{ error: any }>
  // Ticket Messages CRUD operations
  createTicketMessage: (messageData: Omit<TicketMessage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ data: TicketMessage | null; error: any }>
  getTicketMessages: (ticketId: string) => Promise<{ data: TicketMessage[] | null; error: any }>
  updateTicketMessage: (id: string, updates: Partial<TicketMessage>) => Promise<{ data: TicketMessage | null; error: any }>
  deleteTicketMessage: (id: string) => Promise<{ error: any }>
  // Test function
  testTicketSystemConnection: () => Promise<{ success: boolean; error: string | null; code?: string; originalError?: any }>
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
        
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (!error) {
          
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
      
      
      
      
      // Test 1: Try to access any table
      
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      
      
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
        
        return data as UserProfile
      } else {
        
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
                    
                    profile = await createUserProfile(session.user)
                  }
                  
                  if (profile && isMounted) {
                    
                    setUserProfile(profile)
                  }
                } catch (error) {
                  
                }
              }, 100)
            }
          } else {
            
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

    // Listen for auth changes with enhanced state management
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      
      
      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          
          setSession(session)
          setUser(session?.user ?? null)
          break
          
        case 'SIGNED_OUT':
          
          setSession(null)
          setUser(null)
          setUserProfile(null)
          break
          
        case 'TOKEN_REFRESHED':
          
          setSession(session)
          break
          
        case 'USER_UPDATED':
          
          setSession(session)
          setUser(session?.user ?? null)
          break
          
        default:
          
          setSession(session)
          setUser(session?.user ?? null)
      }
      
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
            console.error('❌ Profile fetch failed during auth change:', error)
            // Set fallback profile to prevent loading issues
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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const signOut = async () => {
    try {
      
      
      // Clear local state first
      setUser(null)
      setUserProfile(null)
      setSession(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
        return { error }
      }
      
      
      return { error: null }
    } catch (error) {
      console.error('❌ Unexpected logout error:', error)
      return { error: error as any }
    }
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
      console.error('❌ getAuditProject: No user logged in')
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
        console.error('❌ getAuditProject: Error fetching audit project:', error)
        return { data: null, error }
      }

      
      return { data: data as AuditProjectWithUserId, error: null }
    } catch (error) {
      console.error('❌ getAuditProject: Unexpected error fetching audit project:', error)
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
            seo_analysis,
            all_pages_html
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const queryEndTime = performance.now()
        const queryTime = queryEndTime - queryStartTime

        if (error) {
          console.error('❌ SupabaseContext: Query error after', queryTime.toFixed(2), 'ms:', error)
          return { data: null, error }
        }

        
        
        
        if (data && data.length > 0) {
          const dataSize = JSON.stringify(data).length
          
        }

        // Add default values for meta tags fields if they don't exist
        const projectsWithDefaults = data?.map(project => ({
          ...project,
          meta_tags_data: (project as any).meta_tags_data || null,
          social_meta_tags_data: (project as any).social_meta_tags_data || null
        })) || []

        return { data: projectsWithDefaults as AuditProject[], error: null }
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
      const { social_meta_tags, social_meta_tags_count, ...pageWithoutSocialTags } = pageData
      
      const { data, error } = await supabase
        .from('scraped_pages')
        .insert({
          user_id: user.id,
          ...pageWithoutSocialTags
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

  const getScrapedPage = async (id: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching scraped page:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching scraped page:', error)
      return { data: null, error }
    }
  }

  const updateScrapedPage = async (id: string, updates: Partial<ScrapedPage>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { social_meta_tags, social_meta_tags_count, ...updatesWithoutSocialTags } = updates
      
      const { data, error } = await supabase
        .from('scraped_pages')
        .update(updatesWithoutSocialTags)
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
      const pagesWithUserId = pagesData.map(page => {
        const { social_meta_tags, social_meta_tags_count, ...pageWithoutSocialTags } = page
        return {
          ...pageWithoutSocialTags,
          user_id: user.id
        }
      })

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

  // Function to process and aggregate meta tags data from scraped pages
  const processMetaTagsData = async (auditProjectId: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      

      // Get all scraped pages for this project
      const { data: scrapedPages, error: pagesError } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('audit_project_id', auditProjectId)
        .eq('user_id', user.id)

      if (pagesError) {
        console.error('Error fetching scraped pages for meta tags processing:', pagesError)
        return { data: null, error: pagesError }
      }

      if (!scrapedPages || scrapedPages.length === 0) {
        
        return { data: null, error: null }
      }

      // Process meta tags data from homepage only
      
      const metaTagsData = processAllMetaTags(scrapedPages)
      const socialMetaTagsData = processAllSocialMetaTags(scrapedPages)
      
      
      // Update the audit project with aggregated meta tags data
      // Use a more flexible approach that handles missing columns
      const updateData: any = {}
      
      // Only include fields that exist in the database
      try {
        // Try to update with meta tags data
        const { data: updatedProject, error: updateError } = await supabase
          .from('audit_projects')
          .update({
            meta_tags_data: metaTagsData,
            social_meta_tags_data: socialMetaTagsData
          })
          .eq('id', auditProjectId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateError) {
          console.warn('Meta tags columns may not exist yet, skipping meta tags data update:', updateError.message)
          // Return the project without meta tags data
          const { data: projectData } = await supabase
            .from('audit_projects')
            .select('*')
            .eq('id', auditProjectId)
            .eq('user_id', user.id)
            .single()
          
          return { data: projectData as AuditProjectWithUserId, error: null }
        }

        return { data: updatedProject as AuditProjectWithUserId, error: null }
      } catch (error) {
        console.warn('Error updating meta tags data, columns may not exist:', error)
        // Return the project without meta tags data
        const { data: projectData } = await supabase
          .from('audit_projects')
          .select('*')
          .eq('id', auditProjectId)
          .eq('user_id', user.id)
          .single()
        
        return { data: projectData as AuditProjectWithUserId, error: null }
      }
    } catch (error) {
      console.error('Unexpected error processing meta tags data:', error)
      return { data: null, error }
    }
  }

  // Helper function to process meta tags from a single page (homepage or first available page)
  const processAllMetaTags = (scrapedPages: ScrapedPage[]): MetaTagsData => {
    if (!scrapedPages || scrapedPages.length === 0) {
      return {
        all_meta_tags: [],
        standard_meta_tags: {},
        http_equiv_tags: [],
        custom_meta_tags: [],
        total_count: 0,
        pages_with_meta_tags: 0,
        average_meta_tags_per_page: 0
      }
    }

    // Find the homepage (root URL) or use the first page
    const homepage = scrapedPages.find(page => {
      try {
        const url = new URL(page.url)
        const pathname = url.pathname
        return pathname === '/' || pathname === '' || pathname === '/index.html'
      } catch {
        return false
      }
    }) || scrapedPages[0] // Fallback to first page if no homepage found

    

    const allMetaTags: any[] = []
    const standardMetaTags: any = {}
    const httpEquivTags: any[] = []
    const customMetaTags: any[] = []

    if (homepage.meta_tags_count > 0 && homepage.html_content) {
      // Parse HTML content to extract meta tags
      const metaTags = extractMetaTagsFromHTML(homepage.html_content)
      allMetaTags.push(...metaTags)

      // Categorize meta tags
      metaTags.forEach(tag => {
        if (tag.httpEquiv) {
          httpEquivTags.push(tag)
        } else if (isStandardMetaTag(tag.name)) {
          standardMetaTags[tag.name] = tag.content
        } else {
          customMetaTags.push(tag)
        }
      })
    }

    return {
      all_meta_tags: allMetaTags,
      standard_meta_tags: standardMetaTags,
      http_equiv_tags: httpEquivTags,
      custom_meta_tags: customMetaTags,
      total_count: homepage.meta_tags_count || 0,
      pages_with_meta_tags: homepage.meta_tags_count > 0 ? 1 : 0,
      average_meta_tags_per_page: homepage.meta_tags_count || 0
    }
  }

  // Helper function to process social meta tags from homepage only
  const processAllSocialMetaTags = (scrapedPages: ScrapedPage[]): SocialMetaTagsData => {
    if (!scrapedPages || scrapedPages.length === 0) {
      return {
        open_graph: {},
        twitter: {},
        linkedin: {},
        pinterest: {},
        whatsapp: {},
        telegram: {},
        discord: {},
        slack: {},
        total_social_tags: 0,
        social_meta_tags_count: 0,
        platforms_detected: [],
        completeness_score: 0,
        missing_platforms: ['open_graph', 'twitter', 'linkedin', 'pinterest']
      }
    }

    // Find the homepage (root URL) or use the first page
    const homepage = scrapedPages.find(page => {
      try {
        const url = new URL(page.url)
        const pathname = url.pathname
        return pathname === '/' || pathname === '' || pathname === '/index.html'
      } catch {
        return false
      }
    }) || scrapedPages[0] // Fallback to first page if no homepage found

    

    const allSocialTags: any = {
      open_graph: {},
      twitter: {},
      linkedin: {},
      pinterest: {},
      whatsapp: {},
      telegram: {},
      discord: {},
      slack: {}
    }

    const platformsDetected: string[] = []
    let totalSocialTags = 0
    const socialMetaTagsCount = (homepage as any).social_meta_tags_count || 0

    // Since we're no longer storing full social meta tags data, we'll use the count
    // and provide basic platform detection based on the count
    if (socialMetaTagsCount > 0) {
      // Basic platform detection - this is a simplified approach
      // In a real implementation, you might want to parse the HTML again to detect specific platforms
      platformsDetected.push('social_meta_tags_detected')
      totalSocialTags = socialMetaTagsCount
    }

    // Calculate completeness score based on count
    const expectedPlatforms = ['open_graph', 'twitter', 'linkedin', 'pinterest']
    const missingPlatforms = expectedPlatforms.filter(platform => !platformsDetected.includes(platform))
    const completenessScore = socialMetaTagsCount > 0 ? 50 : 0 // Basic scoring based on presence

    return {
      ...allSocialTags,
      total_social_tags: totalSocialTags,
      social_meta_tags_count: socialMetaTagsCount,
      platforms_detected: platformsDetected,
      completeness_score: completenessScore,
      missing_platforms: missingPlatforms
    }
  }

  // Helper function to extract meta tags from HTML content
  const extractMetaTagsFromHTML = (htmlContent: string): any[] => {
    const metaTags: any[] = []
    const metaTagRegex = /<meta\s+([^>]+)>/gi
    let match

    while ((match = metaTagRegex.exec(htmlContent)) !== null) {
      const attributes = match[1]
      const tag: any = {}

      // Parse attributes
      const attrRegex = /(\w+)=["']([^"']*)["']/g
      let attrMatch

      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        const [, attrName, attrValue] = attrMatch
        tag[attrName] = attrValue
      }

      if (tag.name || tag.property || tag.httpEquiv || tag.charset) {
        metaTags.push({
          name: tag.name || '',
          content: tag.content || '',
          property: tag.property || undefined,
          httpEquiv: tag.httpEquiv || undefined,
          charset: tag.charset || undefined
        })
      }
    }

    return metaTags
  }

  // Helper function to check if a meta tag is standard
  const isStandardMetaTag = (name: string): boolean => {
    const standardTags = [
      'title', 'description', 'keywords', 'author', 'robots', 'viewport',
      'charset', 'language', 'generator', 'rating', 'distribution',
      'copyright', 'reply-to', 'owner', 'url', 'identifier-url',
      'category', 'coverage', 'target', 'handheld-friendly',
      'mobile-optimized', 'apple-mobile-web-app-capable',
      'apple-mobile-web-app-status-bar-style', 'apple-mobile-web-app-title',
      'format-detection', 'theme-color', 'msapplication-tilecolor',
      'msapplication-config'
    ]
    return standardTags.includes(name.toLowerCase())
  }

  // Manual trigger for meta tags processing (useful for existing projects)
  const triggerMetaTagsProcessing = async (auditProjectId: string) => {
    try {
      
      
      const { data, error } = await processMetaTagsData(auditProjectId)
      
      if (error) {
        console.error('❌ Meta tags processing failed:', error)
        return { success: false, error }
      }
      
      
      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error in meta tags processing:', error)
      return { success: false, error }
    }
  }

  // Test database connection for tickets
  const testTicketSystemConnection = async () => {
    try {
      console.log('Testing ticket system database connection...')
      
      // Try a simple query that doesn't trigger RLS issues
      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .limit(1)
      
      console.log('Ticket system connection test result:', { data, error })
      
      if (error) {
        console.error('Ticket system connection failed:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        // Check for specific error types
        if (error.message?.includes('relation "tickets" does not exist') || 
            error.message?.includes('relation "public.tickets" does not exist') ||
            error.code === 'PGRST301') {
          return { 
            success: false, 
            error: 'Ticket system not set up. Please run the database migration script first.',
            code: 'TABLE_NOT_EXISTS'
          }
        }
        
        if (error.message?.includes('permission denied')) {
          return { 
            success: false, 
            error: 'Permission denied. Please check your Supabase RLS policies.',
            code: 'PERMISSION_DENIED'
          }
        }
        
        return { 
          success: false, 
          error: error.message || 'Database connection failed',
          code: error.code 
        }
      }
      
      console.log('Ticket system connection successful')
      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error testing ticket system:', error)
      return { 
        success: false, 
        error: 'Unexpected error occurred',
        originalError: error 
      }
    }
  }

  // Ticket System CRUD operations
  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'resolved_at' | 'closed_at'>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          ...ticketData
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating ticket:', error)
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "tickets" does not exist') || 
            error.message?.includes('relation "public.tickets" does not exist')) {
          return { 
            data: null, 
            error: { 
              message: 'Ticket system not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            } 
          }
        }
        return { data: null, error }
      }

      return { data: data as Ticket, error: null }
    } catch (error) {
      console.error('Unexpected error creating ticket:', error)
      return { data: null, error }
    }
  }

  const getTickets = async () => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      console.log('Attempting to fetch tickets for user:', user.id)
      
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('Supabase response:', { data, error, hasData: !!data, hasError: !!error })

      if (error) {
        console.error('Error fetching tickets:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "tickets" does not exist') || 
            error.message?.includes('relation "public.tickets" does not exist') ||
            error.code === 'PGRST301' ||
            error.message?.includes('does not exist')) {
          return { 
            data: null, 
            error: { 
              message: 'Ticket system not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            } 
          }
        }
        return { data: null, error }
      }

      console.log('Successfully fetched tickets:', data?.length || 0, 'tickets')
      return { data: data as Ticket[], error: null }
    } catch (error) {
      console.error('Unexpected error fetching tickets:', error)
      return { data: null, error: { message: 'Unexpected error occurred', originalError: error } }
    }
  }

  const getTicket = async (id: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      // Get ticket with messages
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError)
        return { data: null, error: ticketError }
      }

      // Get messages for this ticket
      const { data: messages, error: messagesError } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error fetching ticket messages:', messagesError)
        return { data: null, error: messagesError }
      }

      const ticketWithMessages: TicketWithMessages = {
        ...ticket as Ticket,
        messages: messages as TicketMessage[]
      }

      return { data: ticketWithMessages, error: null }
    } catch (error) {
      console.error('Unexpected error fetching ticket:', error)
      return { data: null, error }
    }
  }

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating ticket:', error)
        return { data: null, error }
      }

      return { data: data as Ticket, error: null }
    } catch (error) {
      console.error('Unexpected error updating ticket:', error)
      return { data: null, error }
    }
  }

  const deleteTicket = async (id: string) => {
    if (!user) {
      return { error: { message: 'No user logged in' } }
    }

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting ticket:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error deleting ticket:', error)
      return { error }
    }
  }

  // Ticket Messages CRUD operations
  const createTicketMessage = async (messageData: Omit<TicketMessage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      console.log('Creating ticket message:', messageData)
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          user_id: user.id,
          ...messageData
        })
        .select()
        .single()

      console.log('Create ticket message response:', { data, error, hasData: !!data, hasError: !!error })

      if (error) {
        console.error('Error creating ticket message:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "ticket_messages" does not exist') || 
            error.message?.includes('relation "public.ticket_messages" does not exist') ||
            error.code === 'PGRST301') {
          return { 
            data: null, 
            error: { 
              message: 'Ticket messages table not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            } 
          }
        }
        
        if (error.message?.includes('permission denied')) {
          return { 
            data: null, 
            error: { 
              message: 'Permission denied for ticket messages. Please check your Supabase RLS policies.',
              code: 'PERMISSION_DENIED'
            } 
          }
        }
        
        return { data: null, error }
      }

      console.log('Successfully created ticket message:', data?.id)
      return { data: data as TicketMessage, error: null }
    } catch (error) {
      console.error('Unexpected error creating ticket message:', error)
      return { data: null, error: { message: 'Unexpected error occurred', originalError: error } }
    }
  }

  const getTicketMessages = async (ticketId: string) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      console.log('Fetching ticket messages for ticket:', ticketId)
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      console.log('Ticket messages response:', { data, error, hasData: !!data, hasError: !!error })

      if (error) {
        console.error('Error fetching ticket messages:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          errorKeys: Object.keys(error),
          errorStringified: JSON.stringify(error)
        })
        
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "ticket_messages" does not exist') || 
            error.message?.includes('relation "public.ticket_messages" does not exist') ||
            error.code === 'PGRST301') {
          return { 
            data: null, 
            error: { 
              message: 'Ticket messages table not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            } 
          }
        }
        
        if (error.message?.includes('permission denied')) {
          return { 
            data: null, 
            error: { 
              message: 'Permission denied for ticket messages. Please check your Supabase RLS policies.',
              code: 'PERMISSION_DENIED'
            } 
          }
        }
        
        // Handle empty error objects (likely RLS issues)
        if (!error.message || error.message === '' || Object.keys(error).length === 0) {
          console.warn('Empty error object detected - likely RLS policy issue')
          return { 
            data: null, 
            error: { 
              message: 'RLS policy issue detected. Please run the fix-ticket-messages-rls-permissive.sql script.',
              code: 'RLS_POLICY_ISSUE'
            } 
          }
        }
        
        return { data: null, error }
      }

      console.log('Successfully fetched ticket messages:', data?.length || 0, 'messages')
      return { data: data as TicketMessage[], error: null }
    } catch (error) {
      console.error('Unexpected error fetching ticket messages:', error)
      return { data: null, error: { message: 'Unexpected error occurred', originalError: error } }
    }
  }

  const updateTicketMessage = async (id: string, updates: Partial<TicketMessage>) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } }
    }

    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating ticket message:', error)
        return { data: null, error }
      }

      return { data: data as TicketMessage, error: null }
    } catch (error) {
      console.error('Unexpected error updating ticket message:', error)
      return { data: null, error }
    }
  }

  const deleteTicketMessage = async (id: string) => {
    if (!user) {
      return { error: { message: 'No user logged in' } }
    }

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting ticket message:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error deleting ticket message:', error)
      return { error }
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
    signInWithGoogle,
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
    getScrapedPage,
    updateScrapedPage,
    deleteScrapedPage,
    createScrapedPages,
    processMetaTagsData,
    triggerMetaTagsProcessing,
    // Ticket System functions
    createTicket,
    getTickets,
    getTicket,
    updateTicket,
    deleteTicket,
    createTicketMessage,
    getTicketMessages,
    updateTicketMessage,
    deleteTicketMessage,
    testTicketSystemConnection,
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
