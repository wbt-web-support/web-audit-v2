import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import type { ScrapedPage } from './supabase-types';

// Global request throttling to prevent multiple simultaneous calls
const activeRequests = new Map<
  string,
  Promise<{
    data: any[] | null;
    error: any;
  }>
>();

// Scraping/pages/meta tags functions from SupabaseContext.tsx moved here. Import types from './supabase-types'.
  // Scraped Pages CRUD operations

  const createScrapedPage = async (
    user: User | null,
    pageData: Omit<ScrapedPage, "id" | "user_id" | "created_at" | "updated_at">
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
      const {
        social_meta_tags,

        social_meta_tags_count,

        ...pageWithoutSocialTags
      } = pageData;

      const {
        data,

        error,
      } = await supabase
        .from("scraped_pages")
        .insert({
          user_id: user.id,

          ...pageWithoutSocialTags,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating scraped page:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data,

        error: null,
      };
    } catch (error) {
      console.error("Error creating scraped page:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const getScrapedPages = async (
    user: User | null,
    auditProjectId: string,
    retryCount = 0
  ): Promise<{
    data: any[] | null;

    error: any;
  }> => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
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

          error,
        } = await supabase
          .from("scraped_pages")
          .select("*")
          .eq("audit_project_id", auditProjectId)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error("Error fetching scraped pages:", error);

          console.error("Error details:", JSON.stringify(error, null, 2));

          // Handle database timeout errors specifically

          if (error.code === "57014") {
            return {
              data: null,

              error: {
                message: "Database timeout - please try again later",
              },
            };
          }

          return {
            data: null,

            error,
          };
        }

        return {
          data,

          error: null,
        };
      } catch (error) {
        console.error("Unexpected error fetching scraped pages:", error);

        console.error("Error details:", JSON.stringify(error, null, 2));

        // Check if it's a network error and retry (but not for timeout errors)

        if (
          error instanceof Error &&
          (error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("fetch")) &&
          !error.message.includes("timeout") &&
          retryCount < maxRetries
        ) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          return getScrapedPages(user, auditProjectId, retryCount + 1);
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
      } finally {
        // Always remove from active requests when done

        activeRequests.delete(auditProjectId);
      }
    })();

    // Store the promise and return it

    activeRequests.set(auditProjectId, requestPromise);

    return requestPromise;
  };

  const getScrapedPage = async (user: User | null, id: string) => {
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
        .from("scraped_pages")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching scraped page:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data,

        error: null,
      };
    } catch (error) {
      console.error("Error fetching scraped page:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const updateScrapedPage = async (
    user: User | null,
    id: string,
    updates: Partial<ScrapedPage>
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
      const {
        social_meta_tags,

        social_meta_tags_count,

        ...updatesWithoutSocialTags
      } = updates;

      const {
        data,

        error,
      } = await supabase
        .from("scraped_pages")
        .update(updatesWithoutSocialTags)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating scraped page:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data,

        error: null,
      };
    } catch (error) {
      console.error("Error updating scraped page:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const deleteScrapedPage = async (user: User | null, id: string) => {
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
        .from("scraped_pages")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error deleting scraped page:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data,

        error: null,
      };
    } catch (error) {
      console.error("Error deleting scraped page:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const createScrapedPages = async (
    user: User | null,
    pagesData: Omit<
      ScrapedPage,
      "id" | "user_id" | "created_at" | "updated_at"
    >[]
  ) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    if (!pagesData || pagesData.length === 0) {
      return {
        data: null,

        error: {
          message: "No pages data provided",
        },
      };
    }

    try {
      // Validate and clean the data before insertion

      const sanitizeString = (value: string | null | undefined) => {
        if (typeof value !== "string") return value ?? null;

        return value.replace(/\u0000/g, "");
      };

      const pagesWithUserId = pagesData.map((page) => {
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

          url: sanitizeString(pageWithoutSocialTags.url || ""),

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

          links: pageWithoutSocialTags.links
            ? JSON.stringify(pageWithoutSocialTags.links)
            : null,

          images: pageWithoutSocialTags.images
            ? JSON.stringify(pageWithoutSocialTags.images)
            : null,

          // Filter out null values from arrays to avoid malformed array literals

          technologies: pageWithoutSocialTags.technologies
            ? pageWithoutSocialTags.technologies.filter(
              (tech) => tech !== null && tech !== undefined && tech !== ""
            )
            : null,

          cms_plugins: pageWithoutSocialTags.cms_plugins
            ? pageWithoutSocialTags.cms_plugins.filter(
              (plugin) =>
                plugin !== null && plugin !== undefined && plugin !== ""
            )
            : null,

          social_meta_tags: social_meta_tags
            ? JSON.stringify(social_meta_tags)
            : null,

          performance_analysis: pageWithoutSocialTags.performance_analysis
            ? JSON.stringify(pageWithoutSocialTags.performance_analysis)
            : null,

          // Sanitize potentially problematic text fields

          title: sanitizeString((pageWithoutSocialTags as any).title ?? null),

          description: sanitizeString(
            (pageWithoutSocialTags as any).description ?? null
          ),

          html_content: sanitizeString(
            (pageWithoutSocialTags as any).html_content ?? null
          ),
        };

        return cleanedPage;
      });

      // Validate data before insertion

      const validationErrors: string[] = [];

      pagesWithUserId.forEach((page, index) => {
        if (!page.url) validationErrors.push(`Page ${index}: Missing URL`);

        if (!page.audit_project_id)
          validationErrors.push(`Page ${index}: Missing audit_project_id`);

        if (!page.user_id)
          validationErrors.push(`Page ${index}: Missing user_id`);
      });

      if (validationErrors.length > 0) {
        console.error("❌ Validation errors:", validationErrors);

        return {
          data: null,

          error: {
            message: "Validation failed",

            details: validationErrors,
          },
        };
      }

      // Check if we have valid data

      if (!pagesWithUserId || pagesWithUserId.length === 0) {
        console.error("❌ No valid pages to insert");

        return {
          data: null,

          error: {
            message: "No valid pages to insert",
          },
        };
      }

      // Check if user is authenticated

      if (!user) {
        console.error("❌ No authenticated user");

        return {
          data: null,

          error: {
            message: "No authenticated user",
          },
        };
      }

      // Test database connection first

      try {
        const {
          data: testData,

          error: testError,
        } = await supabase.from("scraped_pages").select("id").limit(1);

        if (testError) {
          console.error("❌ Database connection test failed:", testError);

          // Check for specific error types

          if (
            testError.message?.includes(
              'relation "scraped_pages" does not exist'
            ) ||
            testError.code === "PGRST301"
          ) {
            return {
              data: null,

              error: {
                message: "scraped_pages table does not exist",

                code: "TABLE_NOT_EXISTS",
              },
            };
          }

          if (
            testError.message?.includes("permission denied") ||
            testError.message?.includes("RLS")
          ) {
            return {
              data: null,

              error: {
                message: "Permission denied - check RLS policies",

                code: "PERMISSION_DENIED",
              },
            };
          }

          return {
            data: null,

            error: {
              message: "Database connection failed",

              details: testError,
            },
          };
        }

        // Test if we can insert a simple record

        const testInsertData = {
          user_id: user.id,

          audit_project_id: pagesWithUserId[0]?.audit_project_id,

          url: "test-url",

          status_code: 200,

          title: "Test",

          html_content: "test",

          html_content_length: 4,

          links_count: 0,

          images_count: 0,

          meta_tags_count: 0,

          technologies_count: 0,

          is_external: false,
        };

        const {
          data: insertTestData,

          error: insertTestError,
        } = await supabase
          .from("scraped_pages")
          .insert([testInsertData])
          .select();

        if (insertTestError) {
          console.error("❌ Insert test failed:", insertTestError);

          return {
            data: null,

            error: {
              message: "Insert test failed - likely RLS policy issue",

              details: insertTestError,
            },
          };
        }

        // Clean up test record

        if (insertTestData && insertTestData[0]) {
          await supabase
            .from("scraped_pages")
            .delete()
            .eq("id", insertTestData[0].id);
        }
      } catch (connectionError) {
        console.error("❌ Database connection exception:", connectionError);

        return {
          data: null,

          error: {
            message: "Database connection exception",

            details: connectionError,
          },
        };
      }

      let data, error;

      try {
        const result = await supabase
          .from("scraped_pages")
          .insert(pagesWithUserId)
          .select();

        data = result.data;

        error = result.error;
      } catch (dbException) {
        console.error("❌ Database exception during insert:", dbException);

        console.error("❌ Exception details:", {
          name: dbException instanceof Error ? dbException.name : "Unknown",

          message:
            dbException instanceof Error
              ? dbException.message
              : String(dbException),

          stack: dbException instanceof Error ? dbException.stack : undefined,

          type: typeof dbException,
        });

        return {
          data: null,

          error: {
            message: "Database exception",

            details: dbException,
          },
        };
      }

      if (error) {
        console.error("❌ Database error creating scraped pages:", {
          error,

          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,

          fullError: JSON.stringify(error, null, 2),
        });

        // Log the actual data being inserted for debugging

        console.error("❌ Data being inserted:", {
          samplePage: pagesWithUserId[0],

          totalPages: pagesWithUserId.length,

          dataTypes: pagesWithUserId.map((page) => ({
            url: typeof page.url,

            html_content: typeof page.html_content,

            links: typeof page.links,

            images: typeof page.images,

            audit_project_id: typeof page.audit_project_id,
          })),
        });

        // Check if it's an RLS policy issue

        if (
          !error.message ||
          error.message === "" ||
          Object.keys(error).length === 0
        ) {
          console.error(
            "❌ Empty error object detected - likely RLS policy issue"
          );

          return {
            data: null,

            error: {
              message: "RLS policy issue - check database permissions",

              code: "RLS_POLICY_ISSUE",
            },
          };
        }

        return {
          data: null,

          error: {
            message: error.message,

            details: error.details,

            code: error.code,
          },
        };
      }

      return {
        data,

        error: null,
      };
    } catch (error) {
      console.error("❌ Exception creating scraped pages:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          details: error,
        },
      };
    }
  };

export { createScrapedPage, getScrapedPages, getScrapedPage, updateScrapedPage, deleteScrapedPage, createScrapedPages };