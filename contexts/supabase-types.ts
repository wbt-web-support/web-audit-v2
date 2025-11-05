import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';
import { AuditProject, PageSpeedInsightsData, MetaTagsData, SocialMetaTagsData, DetectedKeysData } from '@/types/audit';
// All types and interfaces have been moved here from SupabaseContext.tsx
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
    feedback_given?: boolean;
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
    page_image: any | null; // Store screenshot image data (JSON)
    Image_gemini_analysis: any | null; // Store Gemini image analysis results (JSON) - Note: column name is case-sensitive
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
    createScrapedImages: (imagesData: Array<{
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
    }>) => Promise<{
      data: any[] | null;
      error: any;
    }>;
    getScrapedImages: (auditProjectId: string) => Promise<{
      data: any[] | null;
      error: any;
    }>;
    getScrapedImagesByPage: (scrapedPageId: string) => Promise<{
      data: any[] | null;
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

export type { UserProfile, AuditProjectWithUserId, ScrapedPage, SupabaseContextType, Ticket, TicketWithMessages, TicketMessage };