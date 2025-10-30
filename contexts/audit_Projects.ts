import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import type { AuditProjectWithUserId } from './supabase-types';
import type { AuditProject } from '@/types/audit';

// Audit Projects CRUD operations
  const createAuditProject = async (
    user: User | null,
    projectData: Omit<
      AuditProjectWithUserId,
      "id" | "user_id" | "created_at" | "updated_at" | "last_audit_at"
    >
  ) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      // Check project limit before creating project

      const {
        data: userData,

        error: userError,
      } = await supabase
        .from("users")
        .select("plan_type, plan_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        return {
          data: null,

          error: {
            message: "Failed to fetch user plan information",
          },
        };
      }

      // Get plan details from plans table - try by plan_id first if available, then by plan_type

      let planData, planError;

      // Try to get by plan_id first if available

      if (userData.plan_id) {
        const result = await supabase
          .from("plans")
          .select("id, name, plan_type, can_use_features, max_projects")
          .eq("id", userData.plan_id)
          .eq("is_active", true)
          .single();

        planData = result.data;

        planError = result.error;
      }

      // If plan_id query failed or no plan_id, try by plan_type

      if (planError || !planData) {
        const result = await supabase
          .from("plans")
          .select("id, name, plan_type, can_use_features, max_projects")
          .eq("plan_type", userData.plan_type)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        planData = result.data;

        planError = result.error;
      }

      if (planError || !planData) {
        console.error("Plan query error in createAuditProject:", planError);

        return {
          data: null,

          error: {
            message: "Failed to fetch plan details",
          },
        };
      }

      // Check current project count

      const {
        data: projects,

        error: projectError,
      } = await supabase
        .from("audit_projects")
        .select("id")
        .eq("user_id", user.id);

      if (projectError) {
        return {
          data: null,

          error: {
            message: "Failed to check project count",
          },
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

            code: "PROJECT_LIMIT_REACHED",

            currentProjects: currentProjectCount,

            maxProjects: maxProjects,

            planType: planData.plan_type,
          },
        };
      }

      // Check feature access for full site crawl

      if (
        projectData.page_type === "multiple" &&
        !planData.can_use_features?.includes("full_site_crawl")
      ) {
        return {
          data: null,

          error: {
            message:
              "Full site crawling is not available in your current plan. Please upgrade to access this feature.",

            code: "FEATURE_NOT_AVAILABLE",

            requiredFeature: "full_site_crawl",

            planType: planData.plan_type,
          },
        };
      }

      // Try with minimal required fields first to avoid RLS issues

      const minimalData = {
        user_id: user.id,

        site_url: projectData.site_url,

        status: projectData.status || "pending",

        progress: projectData.progress || 0,

        page_type: projectData.page_type || "single",

        brand_consistency: projectData.brand_consistency || false,

        hidden_urls: projectData.hidden_urls || false,

        keys_check: projectData.keys_check || false,

        brand_data: projectData.brand_data || null,

        hidden_urls_data: projectData.hidden_urls_data || null,
      };

      const {
        data,

        error,
      } = await supabase
        .from("audit_projects")
        .insert(minimalData)
        .select()
        .single();

      if (error) {
        console.error("Error creating audit project:", error);

        console.error("Error details:", {
          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,

          keys: Object.keys(error),

          isEmpty: Object.keys(error).length === 0,
        });

        // Check for specific error types

        if (
          error.message?.includes('relation "audit_projects" does not exist') ||
          error.code === "PGRST301"
        ) {
          return {
            data: null,

            error: {
              message:
                "Database not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        // Check for empty error object or permission issues

        if (
          error.message?.includes("permission denied") ||
          !error.message ||
          error.message === "" ||
          Object.keys(error).length === 0 ||
          JSON.stringify(error) === "{}"
        ) {
          return {
            data: null,

            error: {
              message:
                "RLS policy issue detected. Please check your Supabase RLS policies.",

              code: "RLS_POLICY_ISSUE",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      // If successful, try to update with additional fields

      if (data) {
        try {
          const {
            data: updatedData,

            error: updateError,
          } = await supabase
            .from("audit_projects")
            .update({
              brand_data: projectData.brand_data,

              hidden_urls_data: projectData.hidden_urls_data,

              pages_per_second: projectData.pages_per_second,

              total_response_time: projectData.total_response_time,

              scraping_completed_at: projectData.scraping_completed_at,

              scraping_data: projectData.scraping_data,

              pagespeed_insights_data: projectData.pagespeed_insights_data,

              pagespeed_insights_loading:
                projectData.pagespeed_insights_loading,

              pagespeed_insights_error: projectData.pagespeed_insights_error,

              meta_tags_data: projectData.meta_tags_data,

              social_meta_tags_data: projectData.social_meta_tags_data,
            })
            .eq("id", data.id)
            .select()
            .single();

          if (!updateError && updatedData) {
            return {
              data: updatedData as AuditProjectWithUserId,

              error: null,
            };
          }
        } catch (updateErr) {
          console.warn(
            "Could not update with additional fields, using minimal data:",
            updateErr
          );
        }
      }

      return {
        data: data as AuditProjectWithUserId,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error creating audit project:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const getAuditProject = async (user: User | null, id: string) => {
    if (!user) {
      console.error("❌ getAuditProject: No user logged in");

      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      const {
        data,

        error,
      } = await supabase
        .from("audit_projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(
          "❌ getAuditProject: Error fetching audit project:",
          error
        );

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as AuditProjectWithUserId,

        error: null,
      };
    } catch (error) {
      console.error(
        "❌ getAuditProject: Unexpected error fetching audit project:",
        error
      );

      return {
        data: null,

        error,
      };
    }
  };

  const getAuditProjects = async (user: User | null) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      const {
        data,

        error,
      } = await supabase
        .from("audit_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error fetching audit projects:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as AuditProjectWithUserId[],

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching audit projects:", error);

      return {
        data: null,

        error,
      };
    }
  };

  // Optimized query that only fetches required columns for dashboard components

  const getAuditProjectsOptimized = async (user: User | null) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    // Check if Supabase is properly configured

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("❌ SupabaseContext: Missing environment variables");

      return {
        data: null,

        error: {
          message:
            "Supabase not configured. Please create a .env.local file with your Supabase credentials.",
        },
      };
    }

    const queryStartTime = performance.now();

    try {
      // Use a simpler query with only essential fields to avoid RLS issues

      const {
        data,

        error,
      } = await supabase
        .from("audit_projects")
        .select(
          `

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

          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      const queryEndTime = performance.now();

      const queryTime = queryEndTime - queryStartTime;

      if (error) {
        console.error(
          "❌ SupabaseContext: Query error after",
          queryTime.toFixed(2),
          "ms:",
          error
        );

        console.error("❌ Error details:", {
          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,
        });

        // Check for specific error types

        if (
          error.message?.includes('relation "audit_projects" does not exist') ||
          error.code === "PGRST301"
        ) {
          return {
            data: null,

            error: {
              message:
                "Database not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        if (
          error.message?.includes("permission denied") ||
          !error.message ||
          error.message === "" ||
          Object.keys(error).length === 0
        ) {
          return {
            data: null,

            error: {
              message:
                "RLS policy issue detected. Please check your Supabase RLS policies.",

              code: "RLS_POLICY_ISSUE",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      if (data && data.length > 0) {
        const dataSize = JSON.stringify(data).length;
      }

      // Add default values for meta tags fields if they don't exist

      const projectsWithDefaults =
        data?.map((project) => ({
          ...(project as any),

          meta_tags_data: (project as any).meta_tags_data || null,

          social_meta_tags_data: (project as any).social_meta_tags_data || null,
        })) || [];

      return {
        data: projectsWithDefaults as AuditProject[],

        error: null,
      };
    } catch (error) {
      const queryEndTime = performance.now();

      const queryTime = queryEndTime - queryStartTime;

      console.error(
        "❌ SupabaseContext: Unexpected error after",
        queryTime.toFixed(2),
        "ms:",
        error
      );

      return {
        data: null,

        error,
      };
    }
  };

  const updateAuditProject = async (
    user: User | null,
    id: string,
    updates: Partial<AuditProjectWithUserId>,
    retryCount = 0
  ) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    const maxRetries = 3;

    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff

    try {
      const {
        data,

        error,
      } = await supabase
        .from("audit_projects")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating audit project:", error);

        console.error("Error details:", JSON.stringify(error, null, 2));

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as AuditProjectWithUserId,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error updating audit project:", error);

      console.error(
        "Unexpected error details:",
        JSON.stringify(error, null, 2)
      );

      // Check if it's a network error and retry

      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("fetch")) &&
        retryCount < maxRetries
      ) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        return updateAuditProject(user, id, updates, retryCount + 1);
      }

      return {
        data: null,

        error:
          error instanceof Error
            ? error
            : {
              message: "Unknown error occurred",
            },
      };
    }
  };

  const deleteAuditProject = async (user: User | null, id: string) => {
    if (!user) {
      return {
        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      const { error } = await supabase
        .from("audit_projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting audit project:", error);

        return {
          error,
        };
      }

      return {
        error: null,
      };
    } catch (error) {
      console.error("Unexpected error deleting audit project:", error);

      return {
        error,
      };
    }
  };

export {
  createAuditProject,
  getAuditProject,
  getAuditProjects,
  getAuditProjectsOptimized,
  updateAuditProject,
  deleteAuditProject,
};