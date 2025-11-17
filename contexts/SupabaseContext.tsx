"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import type {
  UserProfile,
  SupabaseContextType,
  AuditProjectWithUserId,
  ScrapedPage,
  Ticket,
  TicketMessage,
} from './supabase-types';
import {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  resendConfirmation,
  updateProfile as updateProfileRaw,
  fetchUserProfile,
  createUserProfile,
} from './supabase-auth';
import {
  createAuditProject as createAuditProjectRaw,
  getAuditProject as getAuditProjectRaw,
  getAuditProjects as getAuditProjectsRaw,
  getAuditProjectsOptimized as getAuditProjectsOptimizedRaw,
  updateAuditProject as updateAuditProjectRaw,
  deleteAuditProject as deleteAuditProjectRaw,
} from './audit_Projects';
import {
  createScrapedPage as createScrapedPageRaw,
  getScrapedPages as getScrapedPagesRaw,
  getScrapedPage as getScrapedPageRaw,
  updateScrapedPage as updateScrapedPageRaw,
  deleteScrapedPage as deleteScrapedPageRaw,
  createScrapedPages as createScrapedPagesRaw,
  createScrapedImages as createScrapedImagesRaw,
  getScrapedImages as getScrapedImagesRaw,
  getScrapedImagesByPage as getScrapedImagesByPageRaw,
} from './supabase-scraping';
import {
  processMetaTagsData as processMetaTagsDataRaw,
} from './supabase-helpers';
import {
  createTicket as createTicketRaw,
  getTickets as getTicketsRaw,
  getTicket as getTicketRaw,
  updateTicket as updateTicketRaw,
  deleteTicket as deleteTicketRaw,
  createTicketMessage as createTicketMessageRaw,
  getTicketMessages as getTicketMessagesRaw,
  updateTicketMessage as updateTicketMessageRaw,
  deleteTicketMessage as deleteTicketMessageRaw,
  testTicketSystemConnection,
} from './supabase-tickets';
import {
  getUsers as getUsersRaw,
  getUser as getUserRaw,
  updateUser as updateUserRaw,
  blockUser as blockUserRaw,
  unblockUser as unblockUserRaw,
  changeUserRole as changeUserRoleRaw,
  getUserActivity as getUserActivityRaw,
  getUserProjects as getUserProjectsRaw,
  getUserSubscription as getUserSubscriptionRaw,
} from './supabase-user-management';
import { useAuthStore } from '@/lib/stores/authStore';

// Auth and audit project logic are kept local in this context for now

// Refactored: imports from ./supabase-types, ./supabase-auth, ./supabase-projects, ./supabase-scraping, ./supabase-tickets, ./supabase-user-management, ./supabase-helpers
// Only keep high-level state and provider. Properly assemble context value from imported logic.

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { setLoggedIn } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  // Connection retry mechanism

  const retryConnection = async (
    retries = 3,
    delay = 1000
  ): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const {
          data,

          error,
        } = await supabase.from("users").select("count").limit(1);

        if (!error) {
          setIsConnected(true);

          setConnectionError(null);

          return true;
        }

        console.warn(`Connection attempt ${i + 1} failed:`, error.message);

        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      } catch (error) {
        console.warn(`Connection attempt ${i + 1} failed with error:`, error);

        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    console.error("❌ All connection attempts failed");

    setIsConnected(false);

    setConnectionError("Unable to connect to database after multiple attempts");

    return false;
  };
  useEffect(() => {
    let isMounted = true;

    let loadingTimeout: NodeJS.Timeout;

    const initializeConnection = async () => {
      try {
        // Test database connection first

        const connectionTest = await testDatabaseAccess();

        if (!connectionTest && isMounted) {
          console.warn(
            "⚠️ Database connection test failed, but continuing with auth..."
          );
        }

        // Get initial session

        const {
          data: { session },

          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError && isMounted) {
          console.error("Session error:", sessionError);

          setConnectionError(sessionError.message);
        }

        if (isMounted) {
          setSession(session);

          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setLoggedIn(!!currentUser);

          if (session?.user) {
            // Create a fallback profile immediately to avoid loading issues

            const fallbackProfile = {
              id: session.user.id,

              email: session.user.email || "",

              first_name: session.user.user_metadata?.first_name || "",

              last_name: session.user.user_metadata?.last_name || "",

              role: "user" as const,

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

              plan_type: "Starter",

              plan_name: null,

              plan_id: null,

              billing_cycle: "monthly",

              max_projects: 1,

              can_use_features: [],

              plan_expires_at: null,

              subscription_id: null,

              feedback_given: false,
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
                } catch (error) { }
              }, 100);
            }
          } else {
            setUserProfile(null);
          }
        }
      } catch (error) {
        console.error("Error in connection initialization:", error);

        if (isMounted) {
          setConnectionError(
            error instanceof Error ? error.message : "Unknown connection error"
          );
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
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Handle different auth events

      switch (event) {
        case "SIGNED_IN":
          setSession(session);

          const signedInUser = session?.user ?? null;
          setUser(signedInUser);
          setLoggedIn(!!signedInUser);

          break;

        case "SIGNED_OUT":
          setSession(null);

          setUser(null);
          setLoggedIn(false);

          setUserProfile(null);

          break;

        case "TOKEN_REFRESHED":
          setSession(session);

          break;

        case "USER_UPDATED":
          setSession(session);

          const updatedUser = session?.user ?? null;
          setUser(updatedUser);
          setLoggedIn(!!updatedUser);

          break;

        default:
          setSession(session);

          const defaultUser = session?.user ?? null;
          setUser(defaultUser);
          setLoggedIn(!!defaultUser);
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
            console.error("❌ Profile fetch failed during auth change:", error);

            // Set fallback profile to prevent loading issues

            const fallbackProfile = {
              id: session.user.id,

              email: session.user.email || "",

              first_name: session.user.user_metadata?.first_name || "",

              last_name: session.user.user_metadata?.last_name || "",

              role: "user" as const,

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

              plan_type: "Starter",

              plan_name: null,

              plan_id: null,

              billing_cycle: "monthly",

              max_projects: 1,

              can_use_features: [],

              plan_expires_at: null,

              subscription_id: null,

              feedback_given: false,
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
  // Function to test database access

  const testDatabaseAccess = async () => {
    try {
      // Test 1: Try to access users table with a simple query

      const {
        data: testData,

        error: testError,
      } = await supabase.from("users").select("id").limit(1);

      if (testError) {
        console.error("Database access test failed:", testError);

        // Check for specific RLS policy issues

        if (
          testError.message?.includes("infinite recursion") ||
          testError.message?.includes("policy") ||
          testError.message?.includes("permission denied") ||
          !testError.message ||
          testError.message === "" ||
          Object.keys(testError).length === 0
        ) {
          console.warn(
            "⚠️ RLS policy issue detected. This is likely due to circular dependencies or overly restrictive policies."
          );

          console.warn(
            "Please run the fix-all-rls-policies.sql script to resolve this issue."
          );

          console.warn(
            "This script will fix RLS policies for all tables: users, audit_projects, tickets, ticket_messages"
          );

          // Don't throw error for RLS issues, just warn and continue

          setConnectionError(
            "RLS policy issue detected. Please run the fix-all-rls-policies.sql script to fix all database access issues."
          );

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
      console.error("Database access test error:", error);

      console.error("Error type:", typeof error);

      console.error("Error keys:", Object.keys(error || {}));

      // Check if it's an RLS policy issue

      if (
        error instanceof Error &&
        (error.message.includes("infinite recursion") ||
          error.message.includes("policy"))
      ) {
        console.warn(
          "⚠️ RLS policy issue detected. Please run the fix-users-rls-policies.sql script."
        );

        setConnectionError(
          "RLS policy issue detected. Please run the fix-users-rls-policies.sql script."
        );

        return false;
      }

      return false;
    }
  };


  // Wrapped signOut to ensure Zustand store is updated
  const handleSignOut = async () => {
    const result = await signOut();
    // Explicitly update Zustand store on logout
    if (!result.error) {
      setLoggedIn(false);
    }
    return result;
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
    signOut: handleSignOut,
    resendConfirmation,
    updateProfile: async (updates: Partial<UserProfile>) => updateProfileRaw(user, updates),
    // Audit Projects
    createAuditProject: async (
      projectData: Omit<
        AuditProjectWithUserId,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_audit_at'
      >
    ) =>
      createAuditProjectRaw(user, projectData),
    getAuditProject: async (id: string) => getAuditProjectRaw(user, id),
    getAuditProjects: async () => getAuditProjectsRaw(user),
    getAuditProjectsOptimized: async () => getAuditProjectsOptimizedRaw(user),
    updateAuditProject: async (
      id: string,
      updates: Partial<AuditProjectWithUserId>
    ) =>
      updateAuditProjectRaw(user, id, updates),
    deleteAuditProject: async (id: string) => deleteAuditProjectRaw(user, id),
    // Scraped Pages
    createScrapedPage: async (
      pageData: Omit<ScrapedPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) =>
      createScrapedPageRaw(user, pageData),
    getScrapedPages: async (auditProjectId: string) =>
      getScrapedPagesRaw(user, auditProjectId),
    getScrapedPage: async (id: string) => getScrapedPageRaw(user, id),
    updateScrapedPage: async (id: string, updates: Partial<ScrapedPage>) =>
      updateScrapedPageRaw(user, id, updates),
    deleteScrapedPage: async (id: string) => deleteScrapedPageRaw(user, id),
    createScrapedPages: async (
      pagesData: Omit<
        ScrapedPage,
        'id' | 'user_id' | 'created_at' | 'updated_at'
      >[]
    ) =>
      createScrapedPagesRaw(user, pagesData),
    createScrapedImages: async (imagesData: Array<{
      scraped_page_id: string;
      audit_project_id: string | null;
      original_url: string;
      alt_text?: string | null;
      title_text?: string | null;
      width?: number | null;
      height?: number | null;
      type?: string | null;
      size_bytes?: number | null;
      scan_results?: any | null;
      extra_metadata?: any | null;
    }>) =>
      createScrapedImagesRaw(user, imagesData),
    getScrapedImages: async (auditProjectId: string) =>
      getScrapedImagesRaw(user, auditProjectId),
    getScrapedImagesByPage: async (scrapedPageId: string) =>
      getScrapedImagesByPageRaw(user, scrapedPageId),
    // Meta Tags processing
    processMetaTagsData: async (auditProjectId: string) =>
      processMetaTagsDataRaw(user, auditProjectId),
    triggerMetaTagsProcessing: async (auditProjectId: string) => {
      const { error } = await processMetaTagsDataRaw(user, auditProjectId);
      return { success: !error, error };
    },
    // Ticket System
    createTicket: async (
      ticketData: Omit<
        Ticket,
        'id' | 'user_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'resolved_at' | 'closed_at'
      >
    ) => createTicketRaw(ticketData, user),
    getTickets: async () => getTicketsRaw(user),
    getTicket: async (id: string) => getTicketRaw(id, user),
    updateTicket: async (id: string, updates: Partial<Ticket>) => updateTicketRaw(id, updates, user),
    deleteTicket: async (id: string) => deleteTicketRaw(id, user),
    createTicketMessage: async (
      messageData: Omit<TicketMessage, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) =>
      createTicketMessageRaw(messageData, user),
    getTicketMessages: async (ticketId: string) =>
      getTicketMessagesRaw(ticketId, user),
    updateTicketMessage: async (id: string, updates: Partial<TicketMessage>) =>
      updateTicketMessageRaw(id, updates, user),
    deleteTicketMessage: async (id: string) => deleteTicketMessageRaw(id, user),
    testTicketSystemConnection,
    // User Management
    getUsers: async () => getUsersRaw(user),
    getUser: async (userId: string) => getUserRaw(user, userId),
    updateUser: async (userId: string, updates: any) =>
      updateUserRaw(user, userId, updates),
    blockUser: async (userId: string) => blockUserRaw(user, userId),
    unblockUser: async (userId: string) => unblockUserRaw(user, userId),
    changeUserRole: async (userId: string, newRole: 'user' | 'admin') =>
      changeUserRoleRaw(user, userId, newRole),
    getUserActivity: async (userId: string) => getUserActivityRaw(user, userId),
    getUserProjects: async (userId: string) => getUserProjectsRaw(user, userId),
    getUserSubscription: async (userId: string) =>
      getUserSubscriptionRaw(user, userId),
    // Keys detection functions
    getDetectedKeys: async (
      auditProjectId: string,
      page: number = 1,
      limit: number = 20,
      statusFilter: string = 'all',
      severityFilter: string = 'all'
    ) => {
      if (!user) {
        return {
          data: null,
          error: { message: 'User not authenticated', code: 'UNAUTHORIZED' }
        };
      }

      try {
        // Get the project with detected_keys data
        const { data: project, error: projectError } = await supabase
          .from('audit_projects')
          .select('detected_keys')
          .eq('id', auditProjectId)
          .eq('user_id', user.id)
          .single();

        if (projectError) {
          return {
            data: null,
            error: projectError
          };
        }

        // If no detected_keys data, return empty result
        if (!project?.detected_keys || !project.detected_keys.detected_keys) {
          return {
            data: {
              keys: [],
              total: 0,
              page,
              limit,
              totalPages: 0,
              filters: {
                status: statusFilter,
                severity: severityFilter
              },
              summary: {
                totalKeys: 0,
                exposedKeys: 0,
                secureKeys: 0,
                criticalKeys: 0,
                highRiskKeys: 0,
                analysisComplete: false,
                processingTime: 0
              }
            },
            error: null
          };
        }

        // Get all keys from the detected_keys field
        let allKeys = project.detected_keys.detected_keys || [];

        // Apply filters
        if (statusFilter !== 'all') {
          allKeys = allKeys.filter((key: any) => key.status === statusFilter);
        }
        if (severityFilter !== 'all') {
          allKeys = allKeys.filter((key: any) => key.severity === severityFilter);
        }

        // Calculate total after filtering
        const total = allKeys.length;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedKeys = allKeys.slice(startIndex, endIndex);

        // Calculate summary
        const summary = {
          totalKeys: project.detected_keys.total_keys || 0,
          exposedKeys: project.detected_keys.exposed_keys || 0,
          secureKeys: project.detected_keys.secure_keys || 0,
          criticalKeys: project.detected_keys.critical_keys || 0,
          highRiskKeys: project.detected_keys.high_risk_keys || 0,
          analysisComplete: project.detected_keys.analysis_complete || false,
          processingTime: project.detected_keys.processing_time || 0
        };

        return {
          data: {
            keys: paginatedKeys,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            filters: {
              status: statusFilter,
              severity: severityFilter
            },
            summary
          },
          error: null
        };
      } catch (error: any) {
        return {
          data: null,
          error: {
            message: error?.message || 'Failed to fetch detected keys',
            code: 'UNKNOWN_ERROR'
          }
        };
      }
    },
  } as unknown as SupabaseContextType;
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return context;
}
