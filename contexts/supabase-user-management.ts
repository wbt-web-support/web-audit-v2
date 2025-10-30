import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
// User management logic moved here from SupabaseContext.tsx. Import types from './supabase-types'.
 // User Management Functions

 const getUsers = async (user: User | null) => {
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
      } = await supabase.from("users").select("*").order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching users:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any[],

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching users:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const getUser = async (user: User | null, userId: string) => {
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
      } = await supabase.from("users").select("*").eq("id", userId).single();

      if (error) {
        console.error("Error fetching user:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching user:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const updateUser = async (user: User | null, userId: string, updates: any) => {
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
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error updating user:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const blockUser = async (user: User | null, userId: string) => {
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
        .from("users")
        .update({
          blocked: true,

          blocked_at: new Date().toISOString(),

          blocked_by: user.id,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error blocking user:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error blocking user:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const unblockUser = async (user: User | null, userId: string) => {
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
        .from("users")
        .update({
          blocked: false,

          blocked_at: null,

          blocked_by: null,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error unblocking user:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error unblocking user:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const changeUserRole = async (user: User | null, userId: string, newRole: "user" | "admin") => {
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
        .from("users")
        .update({
          role: newRole,

          role_changed_at: new Date().toISOString(),

          role_changed_by: user.id,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error changing user role:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error changing user role:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const getUserActivity = async (user: User | null, userId: string) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      // Get user's audit projects

      const {
        data: projects,

        error: projectsError,
      } = await supabase
        .from("audit_projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      // Get user's tickets

      const {
        data: tickets,

        error: ticketsError,
      } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (projectsError || ticketsError) {
        console.error("Error fetching user activity:", {
          projectsError,

          ticketsError,
        });

        return {
          data: null,

          error: projectsError || ticketsError,
        };
      }

      const activity = {
        projects: projects || [],

        tickets: tickets || [],

        totalProjects: projects?.length || 0,

        totalTickets: tickets?.length || 0,

        lastProject: projects?.[0]?.created_at || null,

        lastTicket: tickets?.[0]?.created_at || null,
      };

      return {
        data: activity,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching user activity:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const getUserProjects = async (user: User | null, userId: string) => {
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
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error fetching user projects:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as any[],

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching user projects:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const getUserSubscription = async (user: User | null, userId: string) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      // This would need a subscription table - for now return mock data

      const mockSubscription = {
        plan: "Starter",

        status: "active",

        startDate: "2024-01-01",

        endDate: null,

        features: ["basic_audit", "limited_projects"],
      };

      return {
        data: mockSubscription,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching user subscription:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

export { getUsers, getUser, updateUser, blockUser, unblockUser, changeUserRole, getUserActivity, getUserProjects, getUserSubscription };