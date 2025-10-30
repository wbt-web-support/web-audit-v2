import { User } from '@supabase/supabase-js';
import type { Ticket, TicketWithMessages, TicketMessage } from './supabase-types';
import { supabase } from '@/lib/supabase-client';

// All functions accept user: User | null as the first argument.


const testTicketSystemConnection = async () => {
    try {
      // Try a simple query that doesn't trigger RLS issues

      const {
        data,

        error,
      } = await supabase.from("tickets").select("id").limit(1);

      if (error) {
        console.error("Ticket system connection failed:", error);

        console.error("Error details:", {
          message: error.message,

          code: error.code,

          details: error.details,

          hint: error.hint,
        });

        // Check for specific error types

        if (
          error.message?.includes('relation "tickets" does not exist') ||
          error.message?.includes('relation "public.tickets" does not exist') ||
          error.code === "PGRST301"
        ) {
          return {
            success: false,

            error:
              "Ticket system not set up. Please run the database migration script first.",

            code: "TABLE_NOT_EXISTS",
          };
        }

        if (error.message?.includes("permission denied")) {
          return {
            success: false,

            error:
              "Permission denied. Please check your Supabase RLS policies.",

            code: "PERMISSION_DENIED",
          };
        }

        return {
          success: false,

          error: error.message || "Database connection failed",

          code: error.code,
        };
      }

      return {
        success: true,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error testing ticket system:", error);

      return {
        success: false,

        error: "Unexpected error occurred",

        originalError: error,
      };
    }
  };
  
const createTicket = async (
    ticketData: Omit<
      Ticket,
      | "id"
      | "user_id"
      | "created_at"
      | "updated_at"
      | "assigned_to"
      | "resolved_at"
      | "closed_at"
    >,
    user: User | null
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
        data,

        error,
      } = await supabase
        .from("tickets")
        .insert({
          user_id: user.id,

          ...ticketData,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating ticket:", error);

        // Check if it's a table doesn't exist error

        if (
          error.message?.includes('relation "tickets" does not exist') ||
          error.message?.includes('relation "public.tickets" does not exist')
        ) {
          return {
            data: null,

            error: {
              message:
                "Ticket system not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as Ticket,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error creating ticket:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const getTickets = async (user: User | null) => {
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
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error fetching tickets:", error);

        console.error("Error details:", {
          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,
        });

        // Check if it's a table doesn't exist error

        if (
          error.message?.includes('relation "tickets" does not exist') ||
          error.message?.includes('relation "public.tickets" does not exist') ||
          error.code === "PGRST301" ||
          error.message?.includes("does not exist")
        ) {
          return {
            data: null,

            error: {
              message:
                "Ticket system not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as Ticket[],

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching tickets:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const getTicket = async (id: string, user: User | null) => {
    if (!user) {
      return {
        data: null,

        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      // Get ticket with messages

      const {
        data: ticket,

        error: ticketError,
      } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (ticketError) {
        console.error("Error fetching ticket:", ticketError);

        return {
          data: null,

          error: ticketError,
        };
      }

      // Get messages for this ticket

      const {
        data: messages,

        error: messagesError,
      } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", {
          ascending: true,
        });

      if (messagesError) {
        console.error("Error fetching ticket messages:", messagesError);

        return {
          data: null,

          error: messagesError,
        };
      }

      const ticketWithMessages: TicketWithMessages = {
        ...(ticket as Ticket),

        messages: messages as TicketMessage[],
      };

      return {
        data: ticketWithMessages,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching ticket:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>, user: User | null) => {
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
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating ticket:", error);

        console.error("Error details:", {
          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,

          errorKeys: Object.keys(error),

          errorStringified: JSON.stringify(error),
        });

        // Check if it's a table doesn't exist error

        if (
          error.message?.includes('relation "tickets" does not exist') ||
          error.message?.includes('relation "public.tickets" does not exist') ||
          error.code === "PGRST301"
        ) {
          return {
            data: null,

            error: {
              message:
                "Ticket system not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        if (error.message?.includes("permission denied")) {
          return {
            data: null,

            error: {
              message:
                "Permission denied for ticket updates. Please check your Supabase RLS policies.",

              code: "PERMISSION_DENIED",
            },
          };
        }

        // Handle empty error objects (likely RLS issues)

        if (
          !error.message ||
          error.message === "" ||
          Object.keys(error).length === 0
        ) {
          console.warn("Empty error object detected - likely RLS policy issue");

          return {
            data: null,

            error: {
              message:
                "RLS policy issue detected. Please run the fix-ticket-messages-rls-permissive.sql script.",

              code: "RLS_POLICY_ISSUE",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as Ticket,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error updating ticket:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const deleteTicket = async (id: string, user: User | null) => {
    if (!user) {
      return {
        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting ticket:", error);

        return {
          error,
        };
      }

      return {
        error: null,
      };
    } catch (error) {
      console.error("Unexpected error deleting ticket:", error);

      return {
        error,
      };
    }
  };

  // Ticket Messages CRUD operations

  const createTicketMessage = async (
    messageData: Omit<
      TicketMessage,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
    user: User | null
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
        data,

        error,
      } = await supabase
        .from("ticket_messages")
        .insert({
          user_id: user.id,

          ...messageData,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating ticket message:", error);

        console.error("Error details:", {
          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,
        });

        // Check if it's a table doesn't exist error

        if (
          error.message?.includes(
            'relation "ticket_messages" does not exist'
          ) ||
          error.message?.includes(
            'relation "public.ticket_messages" does not exist'
          ) ||
          error.code === "PGRST301"
        ) {
          return {
            data: null,

            error: {
              message:
                "Ticket messages table not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        if (error.message?.includes("permission denied")) {
          return {
            data: null,

            error: {
              message:
                "Permission denied for ticket messages. Please check your Supabase RLS policies.",

              code: "PERMISSION_DENIED",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as TicketMessage,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error creating ticket message:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const getTicketMessages = async (ticketId: string, user: User | null) => {
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
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error("Error fetching ticket messages:", error);

        console.error("Error details:", {
          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code,

          errorKeys: Object.keys(error),

          errorStringified: JSON.stringify(error),
        });

        // Check if it's a table doesn't exist error

        if (
          error.message?.includes(
            'relation "ticket_messages" does not exist'
          ) ||
          error.message?.includes(
            'relation "public.ticket_messages" does not exist'
          ) ||
          error.code === "PGRST301"
        ) {
          return {
            data: null,

            error: {
              message:
                "Ticket messages table not set up. Please run the database migration script first.",

              code: "TABLE_NOT_EXISTS",
            },
          };
        }

        if (error.message?.includes("permission denied")) {
          return {
            data: null,

            error: {
              message:
                "Permission denied for ticket messages. Please check your Supabase RLS policies.",

              code: "PERMISSION_DENIED",
            },
          };
        }

        // Handle empty error objects (likely RLS issues)

        if (
          !error.message ||
          error.message === "" ||
          Object.keys(error).length === 0
        ) {
          console.warn("Empty error object detected - likely RLS policy issue");

          return {
            data: null,

            error: {
              message:
                "RLS policy issue detected. Please run the fix-ticket-messages-rls-permissive.sql script.",

              code: "RLS_POLICY_ISSUE",
            },
          };
        }

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as TicketMessage[],

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error fetching ticket messages:", error);

      return {
        data: null,

        error: {
          message: "Unexpected error occurred",

          originalError: error,
        },
      };
    }
  };

  const updateTicketMessage = async (
    id: string,
    updates: Partial<TicketMessage>,
    user: User | null
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
        data,

        error,
      } = await supabase
        .from("ticket_messages")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating ticket message:", error);

        return {
          data: null,

          error,
        };
      }

      return {
        data: data as TicketMessage,

        error: null,
      };
    } catch (error) {
      console.error("Unexpected error updating ticket message:", error);

      return {
        data: null,

        error,
      };
    }
  };

  const deleteTicketMessage = async (id: string, user: User | null) => {
    if (!user) {
      return {
        error: {
          message: "No user logged in",
        },
      };
    }

    try {
      const { error } = await supabase
        .from("ticket_messages")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting ticket message:", error);

        return {
          error,
        };
      }

      return {
        error: null,
      };
    } catch (error) {
      console.error("Unexpected error deleting ticket message:", error);

      return {
        error,
      };
    }
  };

export { createTicket, getTickets, getTicket, updateTicket, deleteTicket, createTicketMessage, getTicketMessages, updateTicketMessage, deleteTicketMessage, testTicketSystemConnection };