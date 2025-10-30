"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import {
  AuditProject,
  CmsPlugin,
  CmsTheme,
  CmsComponent,
  Technology,
  PageSpeedInsightsData,
  MetaTagsData,
  SocialMetaTagsData,
  DetectedKeysData,
} from "@/types/audit";

import { createTicket, getTickets, getTicket, updateTicket, deleteTicket, createTicketMessage, getTicketMessages, updateTicketMessage, deleteTicketMessage, testTicketSystemConnection } from './supabase-tickets';
import type { UserProfile, AuditProjectWithUserId, ScrapedPage, SupabaseContextType, Ticket, TicketWithMessages, TicketMessage } from './supabase-types';
import { getUsers, getUser, updateUser, blockUser, unblockUser, changeUserRole, getUserActivity, getUserProjects, getUserSubscription } from './supabase-user-management';
import { createAuditProject as apCreateAuditProject, getAuditProject as apGetAuditProject, getAuditProjects as apGetAuditProjects, getAuditProjectsOptimized as apGetAuditProjectsOptimized, updateAuditProject as apUpdateAuditProject, deleteAuditProject as apDeleteAuditProject } from './audit_Projects';
import { createScrapedPage as scCreateScrapedPage, getScrapedPages as scGetScrapedPages, getScrapedPage as scGetScrapedPage, updateScrapedPage as scUpdateScrapedPage, deleteScrapedPage as scDeleteScrapedPage, createScrapedPages as scCreateScrapedPages } from './supabase-scraping';
import { fetchUserProfile, createUserProfile } from './supabase-auth';

// Auth and audit project logic are kept local in this context for now

// Refactored: imports from ./supabase-types, ./supabase-auth, ./supabase-projects, ./supabase-scraping, ./supabase-tickets, ./supabase-user-management, ./supabase-helpers
// Only keep high-level state and provider. Properly assemble context value from imported logic.

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
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

          setUser(session?.user ?? null);

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

          setUser(session?.user ?? null);

          break;

        case "SIGNED_OUT":
          setSession(null);

          setUser(null);

          setUserProfile(null);

          break;

        case "TOKEN_REFRESHED":
          setSession(session);

          break;

        case "USER_UPDATED":
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


  // Global request throttling to prevent multiple simultaneous calls

  const activeRequests = new Map<
    string,
    Promise<{
      data: any[] | null;

      error: any;
    }>
  >();

}
export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return context;
}
