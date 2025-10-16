'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { AuditProject, CmsPlugin, CmsTheme, CmsComponent, Technology, PageSpeedInsightsData, MetaTagsData, SocialMetaTagsData, DetectedKeysData } from '@/types/audit';
interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'admin' | 'moderator';
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
  blocked: boolean;
  blocked_at: string | null;
  blocked_by: string | null;
  role_changed_at: string | null;
  role_changed_by: string | null;
  last_activity_at: string | null;
  login_count: number;
  notes: string | null;
  projects: number;
  plan_type: string;
  plan_name: string | null;
  plan_id: string | null;
  billing_cycle: string;
  max_projects: number;
  can_use_features: any[];
  plan_expires_at: string | null;
  subscription_id: string | null;
}
interface AuditProjectWithUserId extends AuditProject {
  user_id: string;
  page_type: 'single' | 'multiple';
  brand_consistency: boolean;
  hidden_urls: boolean;
  keys_check: boolean;
  brand_data: any | null;
  hidden_urls_data: any | null;
  pages_per_second: number;
  total_response_time: number;
  scraping_completed_at: string | null;
  scraping_data: any | null;
  pagespeed_insights_data: PageSpeedInsightsData | null;
  pagespeed_insights_loading: boolean;
  pagespeed_insights_error: string | null;
  meta_tags_data: MetaTagsData | null;
  social_meta_tags_data: SocialMetaTagsData | null;
  detected_keys: DetectedKeysData | null;
}
interface ScrapedPage {
  id: string;
  audit_project_id: string;
  user_id: string;
  url: string;
  status_code: number | null;
  title: string | null;
  description: string | null;
  html_content: string | null;
  html_content_length: number | null;
  links_count: number;
  images_count: number;
  links: any[] | null; // Store actual links data
  images: any[] | null; // Store actual images data
  meta_tags_count: number;
  technologies_count: number;
  technologies: string[] | null;
  cms_type: string | null;
  cms_version: string | null;
  cms_plugins: string[] | null;
  social_meta_tags: any | null;
  social_meta_tags_count: number;
  is_external: boolean;
  response_time: number | null;
  performance_analysis: any | null; // Store PageSpeed Insights analysis results
  created_at: string;
  updated_at: string;
}
interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}
interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
  updated_at: string;
}
interface TicketWithMessages extends Ticket {
  messages: TicketMessage[];
}
interface SupabaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  connectionError: string | null;
  isConnected: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{
    error: AuthError | null;
    message?: string;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
  }>;
  signInWithGoogle: () => Promise<{
    error: AuthError | null;
  }>;
  signOut: () => Promise<{
    error: AuthError | null;
  }>;
  resendConfirmation: (email: string) => Promise<{
    error: AuthError | null;
  }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{
    error: AuthError | PostgrestError | null;
  }>;
  // Audit Projects CRUD operations
  createAuditProject: (projectData: Omit<AuditProjectWithUserId, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'>) => Promise<{
    data: AuditProjectWithUserId | null;
    error: any;
  }>;
  getAuditProject: (id: string) => Promise<{
    data: AuditProjectWithUserId | null;
    error: any;
  }>;
  getAuditProjects: () => Promise<{
    data: AuditProjectWithUserId[] | null;
    error: any;
  }>;
  getAuditProjectsOptimized: () => Promise<{
    data: AuditProject[] | null;
    error: any;
  }>;
  updateAuditProject: (id: string, updates: Partial<AuditProjectWithUserId>) => Promise<{
    data: AuditProjectWithUserId | null;
    error: any;
  }>;
  deleteAuditProject: (id: string) => Promise<{
    error: any;
  }>;
  // Scraped Pages CRUD operations
  createScrapedPage: (pageData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{
    data: ScrapedPage | null;
    error: any;
  }>;
  getScrapedPages: (auditProjectId: string) => Promise<{
    data: ScrapedPage[] | null;
    error: any;
  }>;
  getScrapedPage: (id: string) => Promise<{
    data: ScrapedPage | null;
    error: any;
  }>;
  updateScrapedPage: (id: string, updates: Partial<ScrapedPage>) => Promise<{
    data: ScrapedPage | null;
    error: any;
  }>;
  deleteScrapedPage: (id: string) => Promise<{
    data: ScrapedPage | null;
    error: any;
  }>;
  // Bulk operations
  createScrapedPages: (pagesData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => Promise<{
    data: ScrapedPage[] | null;
    error: any;
  }>;
  // Meta tags processing
  processMetaTagsData: (auditProjectId: string) => Promise<{
    data: AuditProjectWithUserId | null;
    error: any;
  }>;
  // Manual trigger for existing projects
  triggerMetaTagsProcessing: (auditProjectId: string) => Promise<{
    success: boolean;
    error?: any;
  }>;
  // Ticket System CRUD operations
  createTicket: (ticketData: Omit<Ticket, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'resolved_at' | 'closed_at'>) => Promise<{
    data: Ticket | null;
    error: any;
  }>;
  getTickets: () => Promise<{
    data: Ticket[] | null;
    error: any;
  }>;
  getTicket: (id: string) => Promise<{
    data: TicketWithMessages | null;
    error: any;
  }>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<{
    data: Ticket | null;
    error: any;
  }>;
  deleteTicket: (id: string) => Promise<{
    error: any;
  }>;
  // Ticket Messages CRUD operations
  createTicketMessage: (messageData: Omit<TicketMessage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{
    data: TicketMessage | null;
    error: any;
  }>;
  getTicketMessages: (ticketId: string) => Promise<{
    data: TicketMessage[] | null;
    error: any;
  }>;
  updateTicketMessage: (id: string, updates: Partial<TicketMessage>) => Promise<{
    data: TicketMessage | null;
    error: any;
  }>;
  deleteTicketMessage: (id: string) => Promise<{
    error: any;
  }>;
  // Test function
  testTicketSystemConnection: () => Promise<{
    success: boolean;
    error: string | null;
    code?: string;
    originalError?: any;
  }>;
  // User Management functions
  getUsers: () => Promise<{
    data: any[] | null;
    error: any;
  }>;
  getUser: (userId: string) => Promise<{
    data: any | null;
    error: any;
  }>;
  updateUser: (userId: string, updates: any) => Promise<{
    data: any | null;
    error: any;
  }>;
  blockUser: (userId: string) => Promise<{
    data: any | null;
    error: any;
  }>;
  unblockUser: (userId: string) => Promise<{
    data: any | null;
    error: any;
  }>;
  changeUserRole: (userId: string, newRole: 'user' | 'admin') => Promise<{
    data: any | null;
    error: any;
  }>;
  getUserActivity: (userId: string) => Promise<{
    data: any | null;
    error: any;
  }>;
  getUserProjects: (userId: string) => Promise<{
    data: any[] | null;
    error: any;
  }>;
  getUserSubscription: (userId: string) => Promise<{
    data: any | null;
    error: any;
  }>;
  // Keys detection functions
  getDetectedKeys: (auditProjectId: string, page?: number, limit?: number, statusFilter?: string, severityFilter?: string) => Promise<{
    data: any | null;
    error: any;
  }>;
}
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);
export function SupabaseProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connection retry mechanism
  const retryConnection = async (retries = 3, delay = 1000): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const {
          data,
          error
        } = await supabase.from('users').select('count').limit(1);
        if (!error) {
          setIsConnected(true);
          setConnectionError(null);
          return true;
        }
        console.warn(`Connection attempt ${i + 1} failed:`, error.message);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      } catch (error) {
        console.warn(`Connection attempt ${i + 1} failed with error:`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    console.error('❌ All connection attempts failed');
    setIsConnected(false);
    setConnectionError('Unable to connect to database after multiple attempts');
    return false;
  };

  // Function to test database access
  const testDatabaseAccess = async () => {
    try {
      // Test 1: Try to access users table with a simple query
      const {
        data: testData,
        error: testError
      } = await supabase.from('users').select('id').limit(1);
      if (testError) {
        console.error('Database access test failed:', testError);

        // Check for specific RLS policy issues
        if (testError.message?.includes('infinite recursion') || testError.message?.includes('policy') || testError.message?.includes('permission denied') || !testError.message || testError.message === '' || Object.keys(testError).length === 0) {
          console.warn('⚠️ RLS policy issue detected. This is likely due to circular dependencies or overly restrictive policies.');
          console.warn('Please run the fix-all-rls-policies.sql script to resolve this issue.');
          console.warn('This script will fix RLS policies for all tables: users, audit_projects, tickets, ticket_messages');

          // Don't throw error for RLS issues, just warn and continue
          setConnectionError('RLS policy issue detected. Please run the fix-all-rls-policies.sql script to fix all database access issues.');
          return false;
        }
        const connected = await retryConnection();
        if (!connected) {
          throw new Error(`Database connection failed: ${testError.message}`);
        }
      } else {
        setIsConnected(true);
        setConnectionError(null);
        return true;
      }
      return true;
    } catch (error) {
      console.error('Database access test error:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));

      // Check if it's an RLS policy issue
      if (error instanceof Error && (error.message.includes('infinite recursion') || error.message.includes('policy'))) {
        console.warn('⚠️ RLS policy issue detected. Please run the fix-users-rls-policies.sql script.');
        setConnectionError('RLS policy issue detected. Please run the fix-users-rls-policies.sql script.');
        return false;
      }
      return false;
    }
  };

  // Function to create user profile if it doesn't exist
  const createUserProfile = async (user: User) => {
    try {
      // Test database access first
      const dbAccessible = await testDatabaseAccess();
      if (!dbAccessible) {
        console.warn('Database is not accessible, creating fallback profile');
        // Return a fallback profile instead of null
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: 'user' as const,
          email_confirmed: !!user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.created_at,
          blocked: false,
          blocked_at: null,
          blocked_by: null,
          role_changed_at: null,
          role_changed_by: null,
          last_activity_at: null,
          login_count: 0,
          notes: null,
          projects: 0,
          plan_type: 'Starter',
          plan_name: null,
          plan_id: null,
          billing_cycle: 'monthly',
          max_projects: 1,
          can_use_features: [],
          plan_expires_at: null,
          subscription_id: null
        } as UserProfile;
      }
      const profileData = {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'user',
        email_confirmed: !!user.email_confirmed_at
      };
      const {
        data,
        error
      } = await supabase.from('users').insert(profileData).select().single();
      if (error) {
        console.error('Database error creating user profile:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          fullError: JSON.stringify(error, null, 2)
        });

        // Check if it's a duplicate key error (user already exists)
        if (error.code === '23505') {
          return await fetchUserProfile(user.id);
        }

        // If database insert fails, return fallback profile
        console.warn('Database insert failed, creating fallback profile');
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: 'user' as const,
          email_confirmed: !!user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.created_at,
          blocked: false,
          blocked_at: null,
          blocked_by: null,
          role_changed_at: null,
          role_changed_by: null,
          last_activity_at: null,
          login_count: 0,
          notes: null,
          projects: 0,
          plan_type: 'Starter',
          plan_name: null,
          plan_id: null,
          billing_cycle: 'monthly',
          max_projects: 1,
          can_use_features: [],
          plan_expires_at: null,
          subscription_id: null
        } as UserProfile;
      }
      return data as UserProfile;
    } catch (error) {
      console.error('Unexpected error creating user profile:', error);
      // Return fallback profile even on unexpected errors
      return {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'user' as const,
        email_confirmed: !!user.email_confirmed_at,
        created_at: user.created_at
      } as UserProfile;
    }
  };

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      // Try to fetch user profile
      const {
        data,
        error
      } = await supabase.from('users').select('*').eq('id', userId).maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no rows found

      if (error) {
        console.error('Database error fetching user profile:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          fullError: JSON.stringify(error, null, 2)
        });

        // Check for specific error types
        if (error.code === 'PGRST301' || error.message?.includes('relation "users" does not exist')) {
          console.warn('Users table does not exist. Database setup may be required.');
        } else if (error.code === '42501') {
          console.warn('Permission denied. Check RLS policies.');
        }
        return null;
      }
      if (data) {
        return data as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  };
  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;
    const initializeConnection = async () => {
      try {
        // Test database connection first
        const connectionTest = await testDatabaseAccess();
        if (!connectionTest && isMounted) {
          console.warn('⚠️ Database connection test failed, but continuing with auth...');
        }

        // Get initial session
        const {
          data: {
            session
          },
          error: sessionError
        } = await supabase.auth.getSession();
        if (sessionError && isMounted) {
          console.error('Session error:', sessionError);
          setConnectionError(sessionError.message);
        }
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            // Create a fallback profile immediately to avoid loading issues
            const fallbackProfile = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              role: 'user' as const,
              email_confirmed: !!session.user.email_confirmed_at,
              created_at: session.user.created_at,
              updated_at: session.user.created_at,
              blocked: false,
              blocked_at: null,
              blocked_by: null,
              role_changed_at: null,
              role_changed_by: null,
              last_activity_at: null,
              login_count: 0,
              notes: null,
              projects: 0,
              plan_type: 'Starter',
              plan_name: null,
              plan_id: null,
              billing_cycle: 'monthly',
              max_projects: 1,
              can_use_features: [],
              plan_expires_at: null,
              subscription_id: null
            };
            setUserProfile(fallbackProfile);

            // Try to fetch/create profile in background (non-blocking)
            if (isConnected) {
              setTimeout(async () => {
                if (!isMounted) return;
                try {
                  let profile = await fetchUserProfile(session.user.id);
                  if (!profile) {
                    profile = await createUserProfile(session.user);
                  }
                  if (profile && isMounted) {
                    setUserProfile(profile);
                  }
                } catch (error) {}
              }, 100);
            }
          } else {
            setUserProfile(null);
          }
        }
      } catch (error) {
        console.error('Error in connection initialization:', error);
        if (isMounted) {
          setConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set a timeout to ensure loading state is always resolved
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000); // Increased to 5 seconds

    // Initialize connection
    initializeConnection();

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };

    // Listen for auth changes with enhanced state management
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          setSession(session);
          setUser(session?.user ?? null);
          break;
        case 'SIGNED_OUT':
          setSession(null);
          setUser(null);
          setUserProfile(null);
          break;
        case 'TOKEN_REFRESHED':
          setSession(session);
          break;
        case 'USER_UPDATED':
          setSession(session);
          setUser(session?.user ?? null);
          break;
        default:
          setSession(session);
          setUser(session?.user ?? null);
      }
      if (session?.user) {
        // Test connection when auth state changes
        const connected = await retryConnection(2, 500);
        if (connected) {
          // Fetch profile if connected
          try {
            let profile = await fetchUserProfile(session.user.id);
            if (!profile) {
              profile = await createUserProfile(session.user);
            }
            if (profile && isMounted) {
              setUserProfile(profile);
            }
          } catch (error) {
            console.error('❌ Profile fetch failed during auth change:', error);
            // Set fallback profile to prevent loading issues
            const fallbackProfile = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              role: 'user' as const,
              email_confirmed: !!session.user.email_confirmed_at,
              created_at: session.user.created_at,
              updated_at: session.user.created_at,
              blocked: false,
              blocked_at: null,
              blocked_by: null,
              role_changed_at: null,
              role_changed_by: null,
              last_activity_at: null,
              login_count: 0,
              notes: null,
              projects: 0,
              plan_type: 'Starter',
              plan_name: null,
              plan_id: null,
              billing_cycle: 'monthly',
              max_projects: 1,
              can_use_features: [],
              plan_expires_at: null,
              subscription_id: null
            };
            setUserProfile(fallbackProfile);
          }
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const {
      data,
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || ''
        }
      }
    });
    if (error) {
      return {
        error
      };
    }

    // Send welcome email if signup is successful
    if (data.user) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'welcome',
            email: email,
            firstName: firstName || '',
            lastName: lastName || ''
          })
        });
        if (!response.ok) {
          console.warn('Failed to send welcome email:', await response.text());
        }
      } catch (emailError) {
        console.warn('Error sending welcome email:', emailError);
        // Don't fail signup if email fails
      }
    }

    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      return {
        error: null,
        message: 'Please check your email and click the confirmation link to complete your registration.'
      };
    }
    return {
      error: null
    };
  };
  const signIn = async (email: string, password: string) => {
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return {
      error
    };
  };
  const signInWithGoogle = async () => {
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return {
      error
    };
  };
  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setUserProfile(null);
      setSession(null);

      // Sign out from Supabase
      const {
        error
      } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
        return {
          error
        };
      }
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
  const resendConfirmation = async (email: string) => {
    const {
      error
    } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    return {
      error
    };
  };
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return {
        error: {
          message: 'No user logged in'
        } as any
      };
    }
    const {
      error
    } = await supabase.from('users').update(updates).eq('id', user.id);
    if (!error) {
      // Refresh user profile
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
    return {
      error
    };
  };

  // Audit Projects CRUD operations
  const createAuditProject = async (projectData: Omit<AuditProjectWithUserId, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      // Check project limit before creating project
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('plan_type, plan_id').eq('id', user.id).single();
      if (userError || !userData) {
        return {
          data: null,
          error: {
            message: 'Failed to fetch user plan information'
          }
        };
      }

      // Get plan details from plans table - try by plan_id first if available, then by plan_type
      let planData, planError;
      
      // Try to get by plan_id first if available
      if (userData.plan_id) {
        const result = await supabase.from('plans').select('id, name, plan_type, can_use_features, max_projects').eq('id', userData.plan_id).eq('is_active', true).single();
        planData = result.data;
        planError = result.error;
      }
      
      // If plan_id query failed or no plan_id, try by plan_type
      if (planError || !planData) {
        const result = await supabase.from('plans').select('id, name, plan_type, can_use_features, max_projects').eq('plan_type', userData.plan_type).eq('is_active', true).order('created_at', { ascending: true }).limit(1).single();
        planData = result.data;
        planError = result.error;
      }
      
      if (planError || !planData) {
        console.error('Plan query error in createAuditProject:', planError);
        return {
          data: null,
          error: {
            message: 'Failed to fetch plan details'
          }
        };
      }

      // Check current project count
      const {
        data: projects,
        error: projectError
      } = await supabase.from('audit_projects').select('id').eq('user_id', user.id);
      if (projectError) {
        return {
          data: null,
          error: {
            message: 'Failed to check project count'
          }
        };
      }
      const currentProjectCount = projects?.length || 0;
      const maxProjects = planData.max_projects || 1;

      // Check project limit
      if (maxProjects !== -1 && currentProjectCount >= maxProjects) {
        return {
          data: null,
          error: {
            message: `Project limit reached. You have ${currentProjectCount}/${maxProjects} projects. Please upgrade your plan to create more projects.`,
            code: 'PROJECT_LIMIT_REACHED',
            currentProjects: currentProjectCount,
            maxProjects: maxProjects,
            planType: planData.plan_type
          }
        };
      }

      // Check feature access for full site crawl
      if (projectData.page_type === 'multiple' && !planData.can_use_features?.includes('full_site_crawl')) {
        return {
          data: null,
          error: {
            message: 'Full site crawling is not available in your current plan. Please upgrade to access this feature.',
            code: 'FEATURE_NOT_AVAILABLE',
            requiredFeature: 'full_site_crawl',
            planType: planData.plan_type
          }
        };
      }

      // Try with minimal required fields first to avoid RLS issues
      const minimalData = {
        user_id: user.id,
        site_url: projectData.site_url,
        status: projectData.status || 'pending',
        progress: projectData.progress || 0,
        page_type: projectData.page_type || 'single',
        brand_consistency: projectData.brand_consistency || false,
        hidden_urls: projectData.hidden_urls || false,
        keys_check: projectData.keys_check || false,
        brand_data: projectData.brand_data || null,
        hidden_urls_data: projectData.hidden_urls_data || null
      };
      const {
        data,
        error
      } = await supabase.from('audit_projects').insert(minimalData).select().single();
      if (error) {
        console.error('Error creating audit project:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          keys: Object.keys(error),
          isEmpty: Object.keys(error).length === 0
        });

        // Check for specific error types
        if (error.message?.includes('relation "audit_projects" does not exist') || error.code === 'PGRST301') {
          return {
            data: null,
            error: {
              message: 'Database not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }

        // Check for empty error object or permission issues
        if (error.message?.includes('permission denied') || !error.message || error.message === '' || Object.keys(error).length === 0 || JSON.stringify(error) === '{}') {
          return {
            data: null,
            error: {
              message: 'RLS policy issue detected. Please check your Supabase RLS policies.',
              code: 'RLS_POLICY_ISSUE'
            }
          };
        }
        return {
          data: null,
          error
        };
      }

      // If successful, try to update with additional fields
      if (data) {
        try {
          const {
            data: updatedData,
            error: updateError
          } = await supabase.from('audit_projects').update({
            brand_data: projectData.brand_data,
            hidden_urls_data: projectData.hidden_urls_data,
            pages_per_second: projectData.pages_per_second,
            total_response_time: projectData.total_response_time,
            scraping_completed_at: projectData.scraping_completed_at,
            scraping_data: projectData.scraping_data,
            pagespeed_insights_data: projectData.pagespeed_insights_data,
            pagespeed_insights_loading: projectData.pagespeed_insights_loading,
            pagespeed_insights_error: projectData.pagespeed_insights_error,
            meta_tags_data: projectData.meta_tags_data,
            social_meta_tags_data: projectData.social_meta_tags_data
          }).eq('id', data.id).select().single();
          if (!updateError && updatedData) {
            return {
              data: updatedData as AuditProjectWithUserId,
              error: null
            };
          }
        } catch (updateErr) {
          console.warn('Could not update with additional fields, using minimal data:', updateErr);
        }
      }
      return {
        data: data as AuditProjectWithUserId,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error creating audit project:', error);
      return {
        data: null,
        error
      };
    }
  };
  const getAuditProject = async (id: string) => {
    if (!user) {
      console.error('❌ getAuditProject: No user logged in');
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('audit_projects').select('*').eq('id', id).eq('user_id', user.id).single();
      if (error) {
        console.error('❌ getAuditProject: Error fetching audit project:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as AuditProjectWithUserId,
        error: null
      };
    } catch (error) {
      console.error('❌ getAuditProject: Unexpected error fetching audit project:', error);
      return {
        data: null,
        error
      };
    }
  };
  const getAuditProjects = async () => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('audit_projects').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching audit projects:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as AuditProjectWithUserId[],
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching audit projects:', error);
      return {
        data: null,
        error
      };
    }
  };

  // Optimized query that only fetches required columns for dashboard components
  const getAuditProjectsOptimized = async () => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }

    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ SupabaseContext: Missing environment variables');
      return {
        data: null,
        error: {
          message: 'Supabase not configured. Please create a .env.local file with your Supabase credentials.'
        }
      };
    }
    const queryStartTime = performance.now();
    try {
      // Use a simpler query with only essential fields to avoid RLS issues
      const {
        data,
        error
      } = await supabase.from('audit_projects').select(`
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
            cms_detected
          `).eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      const queryEndTime = performance.now();
      const queryTime = queryEndTime - queryStartTime;
      if (error) {
        console.error('❌ SupabaseContext: Query error after', queryTime.toFixed(2), 'ms:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Check for specific error types
        if (error.message?.includes('relation "audit_projects" does not exist') || error.code === 'PGRST301') {
          return {
            data: null,
            error: {
              message: 'Database not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }
        if (error.message?.includes('permission denied') || !error.message || error.message === '' || Object.keys(error).length === 0) {
          return {
            data: null,
            error: {
              message: 'RLS policy issue detected. Please check your Supabase RLS policies.',
              code: 'RLS_POLICY_ISSUE'
            }
          };
        }
        return {
          data: null,
          error
        };
      }
      if (data && data.length > 0) {
        const dataSize = JSON.stringify(data).length;
      }

      // Add default values for meta tags fields if they don't exist
      const projectsWithDefaults = data?.map(project => ({
        ...(project as any),
        meta_tags_data: (project as any).meta_tags_data || null,
        social_meta_tags_data: (project as any).social_meta_tags_data || null
      })) || [];
      return {
        data: projectsWithDefaults as AuditProject[],
        error: null
      };
    } catch (error) {
      const queryEndTime = performance.now();
      const queryTime = queryEndTime - queryStartTime;
      console.error('❌ SupabaseContext: Unexpected error after', queryTime.toFixed(2), 'ms:', error);
      return {
        data: null,
        error
      };
    }
  };
  const updateAuditProject = async (id: string, updates: Partial<AuditProjectWithUserId>, retryCount = 0) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff

    try {
      const {
        data,
        error
      } = await supabase.from('audit_projects').update(updates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) {
        console.error('Error updating audit project:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return {
          data: null,
          error
        };
      }
      return {
        data: data as AuditProjectWithUserId,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error updating audit project:', error);
      console.error('Unexpected error details:', JSON.stringify(error, null, 2));

      // Check if it's a network error and retry
      if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return updateAuditProject(id, updates, retryCount + 1);
      }
      return {
        data: null,
        error: error instanceof Error ? error : {
          message: 'Unknown error occurred'
        }
      };
    }
  };
  const deleteAuditProject = async (id: string) => {
    if (!user) {
      return {
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        error
      } = await supabase.from('audit_projects').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        console.error('Error deleting audit project:', error);
        return {
          error
        };
      }
      return {
        error: null
      };
    } catch (error) {
      console.error('Unexpected error deleting audit project:', error);
      return {
        error
      };
    }
  };

  // Scraped Pages CRUD operations
  const createScrapedPage = async (pageData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        social_meta_tags,
        social_meta_tags_count,
        ...pageWithoutSocialTags
      } = pageData;
      const {
        data,
        error
      } = await supabase.from('scraped_pages').insert({
        user_id: user.id,
        ...pageWithoutSocialTags
      }).select().single();
      if (error) {
        console.error('Error creating scraped page:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error creating scraped page:', error);
      return {
        data: null,
        error
      };
    }
  };

  // Global request throttling to prevent multiple simultaneous calls
  const activeRequests = new Map<string, Promise<{
    data: any[] | null;
    error: any;
  }>>();
  const getScrapedPages = async (auditProjectId: string, retryCount = 0): Promise<{
    data: any[] | null;
    error: any;
  }> => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }

    // Check if request is already in progress for this project
    if (activeRequests.has(auditProjectId)) {
      return activeRequests.get(auditProjectId)!;
    }
    const maxRetries = 1; // Further reduced to prevent server overload
    const retryDelay = 3000 * Math.pow(2, retryCount); // Even longer delays

    // Create the request promise
    const requestPromise = (async (): Promise<{
      data: any[] | null;
      error: any;
    }> => {
      try {
        const {
          data,
          error
        } = await supabase.from('scraped_pages').select('*').eq('audit_project_id', auditProjectId).eq('user_id', user.id).order('created_at', {
          ascending: false
        });
        if (error) {
          console.error('Error fetching scraped pages:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));

          // Handle database timeout errors specifically
          if (error.code === '57014') {
            return {
              data: null,
              error: {
                message: 'Database timeout - please try again later'
              }
            };
          }
          return {
            data: null,
            error
          };
        }
        return {
          data,
          error: null
        };
      } catch (error) {
        console.error('Unexpected error fetching scraped pages:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Check if it's a network error and retry (but not for timeout errors)
        if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) && !error.message.includes('timeout') && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return getScrapedPages(auditProjectId, retryCount + 1);
        }
        return {
          data: null,
          error: error instanceof Error ? error : {
            message: 'Unknown error occurred'
          }
        };
      } finally {
        // Always remove from active requests when done
        activeRequests.delete(auditProjectId);
      }
    })();

    // Store the promise and return it
    activeRequests.set(auditProjectId, requestPromise);
    return requestPromise;
  };
  const getScrapedPage = async (id: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('scraped_pages').select('*').eq('id', id).eq('user_id', user.id).single();
      if (error) {
        console.error('Error fetching scraped page:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching scraped page:', error);
      return {
        data: null,
        error
      };
    }
  };
  const updateScrapedPage = async (id: string, updates: Partial<ScrapedPage>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        social_meta_tags,
        social_meta_tags_count,
        ...updatesWithoutSocialTags
      } = updates;
      const {
        data,
        error
      } = await supabase.from('scraped_pages').update(updatesWithoutSocialTags).eq('id', id).eq('user_id', user.id).select().single();
      if (error) {
        console.error('Error updating scraped page:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error updating scraped page:', error);
      return {
        data: null,
        error
      };
    }
  };
  const deleteScrapedPage = async (id: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('scraped_pages').delete().eq('id', id).eq('user_id', user.id).select().single();
      if (error) {
        console.error('Error deleting scraped page:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error deleting scraped page:', error);
      return {
        data: null,
        error
      };
    }
  };
  const createScrapedPages = async (pagesData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    if (!pagesData || pagesData.length === 0) {
      return {
        data: null,
        error: {
          message: 'No pages data provided'
        }
      };
    }
    try {
      // Validate and clean the data before insertion
      const sanitizeString = (value: string | null | undefined) => {
        if (typeof value !== 'string') return value ?? null;
        return value.replace(/\u0000/g, '');
      };

      const pagesWithUserId = pagesData.map(page => {
        const {
          social_meta_tags,
          social_meta_tags_count,
          ...pageWithoutSocialTags
        } = page;

        // Ensure required fields are present and valid
        const cleanedPage = {
          ...pageWithoutSocialTags,
          user_id: user.id,
          // Ensure audit_project_id is a valid UUID
          audit_project_id: pageWithoutSocialTags.audit_project_id || null,
          // Ensure URL is not empty
          url: sanitizeString(pageWithoutSocialTags.url || ''),
          // Ensure numeric fields are valid
          status_code: pageWithoutSocialTags.status_code || 200,
          html_content_length: pageWithoutSocialTags.html_content_length || 0,
          links_count: pageWithoutSocialTags.links_count || 0,
          images_count: pageWithoutSocialTags.images_count || 0,
          meta_tags_count: pageWithoutSocialTags.meta_tags_count || 0,
          technologies_count: pageWithoutSocialTags.technologies_count || 0,
          social_meta_tags_count: social_meta_tags_count || 0,
          // Ensure boolean fields are valid
          is_external: Boolean(pageWithoutSocialTags.is_external),
          // Ensure JSON fields are properly formatted
          links: pageWithoutSocialTags.links ? JSON.stringify(pageWithoutSocialTags.links) : null,
          images: pageWithoutSocialTags.images ? JSON.stringify(pageWithoutSocialTags.images) : null,
          // Filter out null values from arrays to avoid malformed array literals
          technologies: pageWithoutSocialTags.technologies ? pageWithoutSocialTags.technologies.filter(tech => tech !== null && tech !== undefined && tech !== '') : null,
          cms_plugins: pageWithoutSocialTags.cms_plugins ? pageWithoutSocialTags.cms_plugins.filter(plugin => plugin !== null && plugin !== undefined && plugin !== '') : null,
          social_meta_tags: social_meta_tags ? JSON.stringify(social_meta_tags) : null,
          performance_analysis: pageWithoutSocialTags.performance_analysis ? JSON.stringify(pageWithoutSocialTags.performance_analysis) : null,
          // Sanitize potentially problematic text fields
          title: sanitizeString((pageWithoutSocialTags as any).title ?? null),
          description: sanitizeString((pageWithoutSocialTags as any).description ?? null),
          html_content: sanitizeString((pageWithoutSocialTags as any).html_content ?? null)
        };
        return cleanedPage;
      });
      // Validate data before insertion
      const validationErrors: string[] = [];
      pagesWithUserId.forEach((page, index) => {
        if (!page.url) validationErrors.push(`Page ${index}: Missing URL`);
        if (!page.audit_project_id) validationErrors.push(`Page ${index}: Missing audit_project_id`);
        if (!page.user_id) validationErrors.push(`Page ${index}: Missing user_id`);
      });
      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors);
        return {
          data: null,
          error: {
            message: 'Validation failed',
            details: validationErrors
          }
        };
      }
      // Check if we have valid data
      if (!pagesWithUserId || pagesWithUserId.length === 0) {
        console.error('❌ No valid pages to insert');
        return {
          data: null,
          error: {
            message: 'No valid pages to insert'
          }
        };
      }

      // Check if user is authenticated
      if (!user) {
        console.error('❌ No authenticated user');
        return {
          data: null,
          error: {
            message: 'No authenticated user'
          }
        };
      }

      // Test database connection first
      try {
        const {
          data: testData,
          error: testError
        } = await supabase.from('scraped_pages').select('id').limit(1);
        if (testError) {
          console.error('❌ Database connection test failed:', testError);

          // Check for specific error types
          if (testError.message?.includes('relation "scraped_pages" does not exist') || testError.code === 'PGRST301') {
            return {
              data: null,
              error: {
                message: 'scraped_pages table does not exist',
                code: 'TABLE_NOT_EXISTS'
              }
            };
          }
          if (testError.message?.includes('permission denied') || testError.message?.includes('RLS')) {
            return {
              data: null,
              error: {
                message: 'Permission denied - check RLS policies',
                code: 'PERMISSION_DENIED'
              }
            };
          }
          return {
            data: null,
            error: {
              message: 'Database connection failed',
              details: testError
            }
          };
        }

        // Test if we can insert a simple record

        const testInsertData = {
          user_id: user.id,
          audit_project_id: pagesWithUserId[0]?.audit_project_id,
          url: 'test-url',
          status_code: 200,
          title: 'Test',
          html_content: 'test',
          html_content_length: 4,
          links_count: 0,
          images_count: 0,
          meta_tags_count: 0,
          technologies_count: 0,
          is_external: false
        };
        const {
          data: insertTestData,
          error: insertTestError
        } = await supabase.from('scraped_pages').insert([testInsertData]).select();
        if (insertTestError) {
          console.error('❌ Insert test failed:', insertTestError);
          return {
            data: null,
            error: {
              message: 'Insert test failed - likely RLS policy issue',
              details: insertTestError
            }
          };
        }

        // Clean up test record
        if (insertTestData && insertTestData[0]) {
          await supabase.from('scraped_pages').delete().eq('id', insertTestData[0].id);
        }
      } catch (connectionError) {
        console.error('❌ Database connection exception:', connectionError);
        return {
          data: null,
          error: {
            message: 'Database connection exception',
            details: connectionError
          }
        };
      }
      let data, error;
      try {
        const result = await supabase.from('scraped_pages').insert(pagesWithUserId).select();
        data = result.data;
        error = result.error;
      } catch (dbException) {
        console.error('❌ Database exception during insert:', dbException);
        console.error('❌ Exception details:', {
          name: dbException instanceof Error ? dbException.name : 'Unknown',
          message: dbException instanceof Error ? dbException.message : String(dbException),
          stack: dbException instanceof Error ? dbException.stack : undefined,
          type: typeof dbException
        });
        return {
          data: null,
          error: {
            message: 'Database exception',
            details: dbException
          }
        };
      }
      if (error) {
        console.error('❌ Database error creating scraped pages:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });

        // Log the actual data being inserted for debugging
        console.error('❌ Data being inserted:', {
          samplePage: pagesWithUserId[0],
          totalPages: pagesWithUserId.length,
          dataTypes: pagesWithUserId.map(page => ({
            url: typeof page.url,
            html_content: typeof page.html_content,
            links: typeof page.links,
            images: typeof page.images,
            audit_project_id: typeof page.audit_project_id
          }))
        });

        // Check if it's an RLS policy issue
        if (!error.message || error.message === '' || Object.keys(error).length === 0) {
          console.error('❌ Empty error object detected - likely RLS policy issue');
          return {
            data: null,
            error: {
              message: 'RLS policy issue - check database permissions',
              code: 'RLS_POLICY_ISSUE'
            }
          };
        }
        return {
          data: null,
          error: {
            message: error.message,
            details: error.details,
            code: error.code
          }
        };
      }
      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('❌ Exception creating scraped pages:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          details: error
        }
      };
    }
  };

  // Function to process and aggregate meta tags data from scraped pages
  const processMetaTagsData = async (auditProjectId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      // Get all scraped pages for this project
      const {
        data: scrapedPages,
        error: pagesError
      } = await supabase.from('scraped_pages').select('*').eq('audit_project_id', auditProjectId).eq('user_id', user.id);
      if (pagesError) {
        console.error('Error fetching scraped pages for meta tags processing:', pagesError);
        return {
          data: null,
          error: pagesError
        };
      }
      if (!scrapedPages || scrapedPages.length === 0) {
        return {
          data: null,
          error: null
        };
      }

      // Process meta tags data from homepage only

      const metaTagsData = processAllMetaTags(scrapedPages);
      const socialMetaTagsData = processAllSocialMetaTags(scrapedPages);

      // Update the audit project with aggregated meta tags data
      // Use a more flexible approach that handles missing columns
      const updateData: any = {};

      // Only include fields that exist in the database
      try {
        // Try to update with meta tags data
        const {
          data: updatedProject,
          error: updateError
        } = await supabase.from('audit_projects').update({
          meta_tags_data: metaTagsData,
          social_meta_tags_data: socialMetaTagsData
        }).eq('id', auditProjectId).eq('user_id', user.id).select().single();
        if (updateError) {
          console.warn('Meta tags columns may not exist yet, skipping meta tags data update:', updateError.message);
          // Return the project without meta tags data
          const {
            data: projectData
          } = await supabase.from('audit_projects').select('*').eq('id', auditProjectId).eq('user_id', user.id).single();
          return {
            data: projectData as AuditProjectWithUserId,
            error: null
          };
        }
        return {
          data: updatedProject as AuditProjectWithUserId,
          error: null
        };
      } catch (error) {
        console.warn('Error updating meta tags data, columns may not exist:', error);
        // Return the project without meta tags data
        const {
          data: projectData
        } = await supabase.from('audit_projects').select('*').eq('id', auditProjectId).eq('user_id', user.id).single();
        return {
          data: projectData as AuditProjectWithUserId,
          error: null
        };
      }
    } catch (error) {
      console.error('Unexpected error processing meta tags data:', error);
      return {
        data: null,
        error
      };
    }
  };

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
      };
    }

    // Find the homepage (root URL) or use the first page
    const homepage = scrapedPages.find(page => {
      try {
        const url = new URL(page.url);
        const pathname = url.pathname;
        return pathname === '/' || pathname === '' || pathname === '/index.html';
      } catch {
        return false;
      }
    }) || scrapedPages[0]; // Fallback to first page if no homepage found

    const allMetaTags: any[] = [];
    const standardMetaTags: any = {};
    const httpEquivTags: any[] = [];
    const customMetaTags: any[] = [];
    if (homepage.meta_tags_count > 0 && homepage.html_content) {
      // Parse HTML content to extract meta tags
      const metaTags = extractMetaTagsFromHTML(homepage.html_content);
      allMetaTags.push(...metaTags);

      // Categorize meta tags
      metaTags.forEach(tag => {
        if (tag.httpEquiv) {
          httpEquivTags.push(tag);
        } else if (isStandardMetaTag(tag.name)) {
          standardMetaTags[tag.name] = tag.content;
        } else {
          customMetaTags.push(tag);
        }
      });
    }
    return {
      all_meta_tags: allMetaTags,
      standard_meta_tags: standardMetaTags,
      http_equiv_tags: httpEquivTags,
      custom_meta_tags: customMetaTags,
      total_count: homepage.meta_tags_count || 0,
      pages_with_meta_tags: homepage.meta_tags_count > 0 ? 1 : 0,
      average_meta_tags_per_page: homepage.meta_tags_count || 0
    };
  };

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
      };
    }

    // Find the homepage (root URL) or use the first page
    const homepage = scrapedPages.find(page => {
      try {
        const url = new URL(page.url);
        const pathname = url.pathname;
        return pathname === '/' || pathname === '' || pathname === '/index.html';
      } catch {
        return false;
      }
    }) || scrapedPages[0]; // Fallback to first page if no homepage found

    const allSocialTags: any = {
      open_graph: {},
      twitter: {},
      linkedin: {},
      pinterest: {},
      whatsapp: {},
      telegram: {},
      discord: {},
      slack: {}
    };
    const platformsDetected: string[] = [];
    let totalSocialTags = 0;
    const socialMetaTagsCount = (homepage as any).social_meta_tags_count || 0;

    // Since we're no longer storing full social meta tags data, we'll use the count
    // and provide basic platform detection based on the count
    if (socialMetaTagsCount > 0) {
      // Basic platform detection - this is a simplified approach
      // In a real implementation, you might want to parse the HTML again to detect specific platforms
      platformsDetected.push('social_meta_tags_detected');
      totalSocialTags = socialMetaTagsCount;
    }

    // Calculate completeness score based on count
    const expectedPlatforms = ['open_graph', 'twitter', 'linkedin', 'pinterest'];
    const missingPlatforms = expectedPlatforms.filter(platform => !platformsDetected.includes(platform));
    const completenessScore = socialMetaTagsCount > 0 ? 50 : 0; // Basic scoring based on presence

    return {
      ...allSocialTags,
      total_social_tags: totalSocialTags,
      social_meta_tags_count: socialMetaTagsCount,
      platforms_detected: platformsDetected,
      completeness_score: completenessScore,
      missing_platforms: missingPlatforms
    };
  };

  // Helper function to extract meta tags from HTML content
  const extractMetaTagsFromHTML = (htmlContent: string): any[] => {
    const metaTags: any[] = [];
    const metaTagRegex = /<meta\s+([^>]+)>/gi;
    let match;
    while ((match = metaTagRegex.exec(htmlContent)) !== null) {
      const attributes = match[1];
      const tag: any = {};

      // Parse attributes
      const attrRegex = /(\w+)=["']([^"']*)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        const [, attrName, attrValue] = attrMatch;
        tag[attrName] = attrValue;
      }
      if (tag.name || tag.property || tag.httpEquiv || tag.charset) {
        metaTags.push({
          name: tag.name || '',
          content: tag.content || '',
          property: tag.property || undefined,
          httpEquiv: tag.httpEquiv || undefined,
          charset: tag.charset || undefined
        });
      }
    }
    return metaTags;
  };

  // Helper function to check if a meta tag is standard
  const isStandardMetaTag = (name: string): boolean => {
    const standardTags = ['title', 'description', 'keywords', 'author', 'robots', 'viewport', 'charset', 'language', 'generator', 'rating', 'distribution', 'copyright', 'reply-to', 'owner', 'url', 'identifier-url', 'category', 'coverage', 'target', 'handheld-friendly', 'mobile-optimized', 'apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style', 'apple-mobile-web-app-title', 'format-detection', 'theme-color', 'msapplication-tilecolor', 'msapplication-config'];
    return standardTags.includes(name.toLowerCase());
  };

  // Manual trigger for meta tags processing (useful for existing projects)
  const triggerMetaTagsProcessing = async (auditProjectId: string) => {
    try {
      const {
        data,
        error
      } = await processMetaTagsData(auditProjectId);
      if (error) {
        console.error('❌ Meta tags processing failed:', error);
        return {
          success: false,
          error
        };
      }
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Unexpected error in meta tags processing:', error);
      return {
        success: false,
        error
      };
    }
  };

  // Test database connection for tickets
  const testTicketSystemConnection = async () => {
    try {
      // Try a simple query that doesn't trigger RLS issues
      const {
        data,
        error
      } = await supabase.from('tickets').select('id').limit(1);
      if (error) {
        console.error('Ticket system connection failed:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // Check for specific error types
        if (error.message?.includes('relation "tickets" does not exist') || error.message?.includes('relation "public.tickets" does not exist') || error.code === 'PGRST301') {
          return {
            success: false,
            error: 'Ticket system not set up. Please run the database migration script first.',
            code: 'TABLE_NOT_EXISTS'
          };
        }
        if (error.message?.includes('permission denied')) {
          return {
            success: false,
            error: 'Permission denied. Please check your Supabase RLS policies.',
            code: 'PERMISSION_DENIED'
          };
        }
        return {
          success: false,
          error: error.message || 'Database connection failed',
          code: error.code
        };
      }
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error testing ticket system:', error);
      return {
        success: false,
        error: 'Unexpected error occurred',
        originalError: error
      };
    }
  };

  // Ticket System CRUD operations
  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'resolved_at' | 'closed_at'>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('tickets').insert({
        user_id: user.id,
        ...ticketData
      }).select().single();
      if (error) {
        console.error('Error creating ticket:', error);
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "tickets" does not exist') || error.message?.includes('relation "public.tickets" does not exist')) {
          return {
            data: null,
            error: {
              message: 'Ticket system not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }
        return {
          data: null,
          error
        };
      }
      return {
        data: data as Ticket,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error creating ticket:', error);
      return {
        data: null,
        error
      };
    }
  };
  const getTickets = async () => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching tickets:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "tickets" does not exist') || error.message?.includes('relation "public.tickets" does not exist') || error.code === 'PGRST301' || error.message?.includes('does not exist')) {
          return {
            data: null,
            error: {
              message: 'Ticket system not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }
        return {
          data: null,
          error
        };
      }
      return {
        data: data as Ticket[],
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching tickets:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const getTicket = async (id: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      // Get ticket with messages
      const {
        data: ticket,
        error: ticketError
      } = await supabase.from('tickets').select('*').eq('id', id).eq('user_id', user.id).single();
      if (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        return {
          data: null,
          error: ticketError
        };
      }

      // Get messages for this ticket
      const {
        data: messages,
        error: messagesError
      } = await supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', {
        ascending: true
      });
      if (messagesError) {
        console.error('Error fetching ticket messages:', messagesError);
        return {
          data: null,
          error: messagesError
        };
      }
      const ticketWithMessages: TicketWithMessages = {
        ...(ticket as Ticket),
        messages: messages as TicketMessage[]
      };
      return {
        data: ticketWithMessages,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching ticket:', error);
      return {
        data: null,
        error
      };
    }
  };
  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
      if (error) {
        console.error('Error updating ticket:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          errorKeys: Object.keys(error),
          errorStringified: JSON.stringify(error)
        });

        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "tickets" does not exist') || error.message?.includes('relation "public.tickets" does not exist') || error.code === 'PGRST301') {
          return {
            data: null,
            error: {
              message: 'Ticket system not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }
        if (error.message?.includes('permission denied')) {
          return {
            data: null,
            error: {
              message: 'Permission denied for ticket updates. Please check your Supabase RLS policies.',
              code: 'PERMISSION_DENIED'
            }
          };
        }

        // Handle empty error objects (likely RLS issues)
        if (!error.message || error.message === '' || Object.keys(error).length === 0) {
          console.warn('Empty error object detected - likely RLS policy issue');
          return {
            data: null,
            error: {
              message: 'RLS policy issue detected. Please run the fix-ticket-messages-rls-permissive.sql script.',
              code: 'RLS_POLICY_ISSUE'
            }
          };
        }
        return {
          data: null,
          error
        };
      }
      return {
        data: data as Ticket,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error updating ticket:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const deleteTicket = async (id: string) => {
    if (!user) {
      return {
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        error
      } = await supabase.from('tickets').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        console.error('Error deleting ticket:', error);
        return {
          error
        };
      }
      return {
        error: null
      };
    } catch (error) {
      console.error('Unexpected error deleting ticket:', error);
      return {
        error
      };
    }
  };

  // Ticket Messages CRUD operations
  const createTicketMessage = async (messageData: Omit<TicketMessage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('ticket_messages').insert({
        user_id: user.id,
        ...messageData
      }).select().single();
      if (error) {
        console.error('Error creating ticket message:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "ticket_messages" does not exist') || error.message?.includes('relation "public.ticket_messages" does not exist') || error.code === 'PGRST301') {
          return {
            data: null,
            error: {
              message: 'Ticket messages table not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }
        if (error.message?.includes('permission denied')) {
          return {
            data: null,
            error: {
              message: 'Permission denied for ticket messages. Please check your Supabase RLS policies.',
              code: 'PERMISSION_DENIED'
            }
          };
        }
        return {
          data: null,
          error
        };
      }
      return {
        data: data as TicketMessage,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error creating ticket message:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const getTicketMessages = async (ticketId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching ticket messages:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          errorKeys: Object.keys(error),
          errorStringified: JSON.stringify(error)
        });

        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "ticket_messages" does not exist') || error.message?.includes('relation "public.ticket_messages" does not exist') || error.code === 'PGRST301') {
          return {
            data: null,
            error: {
              message: 'Ticket messages table not set up. Please run the database migration script first.',
              code: 'TABLE_NOT_EXISTS'
            }
          };
        }
        if (error.message?.includes('permission denied')) {
          return {
            data: null,
            error: {
              message: 'Permission denied for ticket messages. Please check your Supabase RLS policies.',
              code: 'PERMISSION_DENIED'
            }
          };
        }

        // Handle empty error objects (likely RLS issues)
        if (!error.message || error.message === '' || Object.keys(error).length === 0) {
          console.warn('Empty error object detected - likely RLS policy issue');
          return {
            data: null,
            error: {
              message: 'RLS policy issue detected. Please run the fix-ticket-messages-rls-permissive.sql script.',
              code: 'RLS_POLICY_ISSUE'
            }
          };
        }
        return {
          data: null,
          error
        };
      }
      return {
        data: data as TicketMessage[],
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching ticket messages:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const updateTicketMessage = async (id: string, updates: Partial<TicketMessage>) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('ticket_messages').update(updates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) {
        console.error('Error updating ticket message:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as TicketMessage,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error updating ticket message:', error);
      return {
        data: null,
        error
      };
    }
  };
  const deleteTicketMessage = async (id: string) => {
    if (!user) {
      return {
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        error
      } = await supabase.from('ticket_messages').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        console.error('Error deleting ticket message:', error);
        return {
          error
        };
      }
      return {
        error: null
      };
    } catch (error) {
      console.error('Unexpected error deleting ticket message:', error);
      return {
        error
      };
    }
  };

  // User Management Functions
  const getUsers = async () => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('users').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching users:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any[],
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const getUser = async (userId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) {
        console.error('Error fetching user:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const updateUser = async (userId: string, updates: any) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('users').update(updates).eq('id', userId).select().single();
      if (error) {
        console.error('Error updating user:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error updating user:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const blockUser = async (userId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('users').update({
        blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_by: user.id
      }).eq('id', userId).select().single();
      if (error) {
        console.error('Error blocking user:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error blocking user:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const unblockUser = async (userId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('users').update({
        blocked: false,
        blocked_at: null,
        blocked_by: null
      }).eq('id', userId).select().single();
      if (error) {
        console.error('Error unblocking user:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error unblocking user:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const changeUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('users').update({
        role: newRole,
        role_changed_at: new Date().toISOString(),
        role_changed_by: user.id
      }).eq('id', userId).select().single();
      if (error) {
        console.error('Error changing user role:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error changing user role:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const getUserActivity = async (userId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      // Get user's audit projects
      const {
        data: projects,
        error: projectsError
      } = await supabase.from('audit_projects').select('*').eq('user_id', userId).order('created_at', {
        ascending: false
      });

      // Get user's tickets
      const {
        data: tickets,
        error: ticketsError
      } = await supabase.from('tickets').select('*').eq('user_id', userId).order('created_at', {
        ascending: false
      });
      if (projectsError || ticketsError) {
        console.error('Error fetching user activity:', {
          projectsError,
          ticketsError
        });
        return {
          data: null,
          error: projectsError || ticketsError
        };
      }
      const activity = {
        projects: projects || [],
        tickets: tickets || [],
        totalProjects: projects?.length || 0,
        totalTickets: tickets?.length || 0,
        lastProject: projects?.[0]?.created_at || null,
        lastTicket: tickets?.[0]?.created_at || null
      };
      return {
        data: activity,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching user activity:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const getUserProjects = async (userId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('audit_projects').select('*').eq('user_id', userId).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching user projects:', error);
        return {
          data: null,
          error
        };
      }
      return {
        data: data as any[],
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching user projects:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };
  const getUserSubscription = async (userId: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      // This would need a subscription table - for now return mock data
      const mockSubscription = {
        plan: 'Starter',
        status: 'active',
        startDate: '2024-01-01',
        endDate: null,
        features: ['basic_audit', 'limited_projects']
      };
      return {
        data: mockSubscription,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching user subscription:', error);
      return {
        data: null,
        error: {
          message: 'Unexpected error occurred',
          originalError: error
        }
      };
    }
  };

  // Fetch detected keys from database with pagination and filtering
  const getDetectedKeys = async (auditProjectId: string, page = 1, limit = 20, statusFilter?: string, severityFilter?: string) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'No user logged in'
        }
      };
    }
    try {
      const {
        data,
        error
      } = await supabase.from('audit_projects').select('detected_keys').eq('id', auditProjectId).eq('user_id', user.id).single();
      if (error) {
        // Silent error handling - KeysTab has fallback to client-side detection
        return {
          data: null,
          error
        };
      }
      if (!data?.detected_keys) {
        return {
          data: {
            keys: [],
            total: 0,
            page,
            limit
          },
          error: null
        };
      }
      const keysData = data.detected_keys;
      let allKeys = keysData.detected_keys || [];

      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        allKeys = allKeys.filter((key: any) => key.status === statusFilter);
      }
      if (severityFilter && severityFilter !== 'all') {
        allKeys = allKeys.filter((key: any) => key.severity === severityFilter);
      }

      // Calculate pagination
      const total = allKeys.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedKeys = allKeys.slice(startIndex, endIndex);
      return {
        data: {
          keys: paginatedKeys,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          filters: {
            status: statusFilter || 'all',
            severity: severityFilter || 'all'
          },
          summary: {
            totalKeys: keysData.total_keys || 0,
            exposedKeys: keysData.exposed_keys || 0,
            secureKeys: keysData.secure_keys || 0,
            criticalKeys: keysData.critical_keys || 0,
            highRiskKeys: keysData.high_risk_keys || 0,
            analysisComplete: keysData.analysis_complete || false,
            processingTime: keysData.processing_time || 0
          }
        },
        error: null
      };
    } catch (error) {
      console.error('Unexpected error fetching detected keys:', error);
      return {
        data: null,
        error
      };
    }
  };
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
    // User Management functions
    getUsers,
    getUser,
    updateUser,
    blockUser,
    unblockUser,
    changeUserRole,
    getUserActivity,
    getUserProjects,
    getUserSubscription,
    getDetectedKeys
  };
  return <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>;
}
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}