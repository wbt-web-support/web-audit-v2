export interface AuditProject {
  id: string
  site_url: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  last_audit_at: string | null
  issues_count: number
  score: number
  created_at: string
  updated_at: string
  total_pages: number
  total_links: number
  total_images: number
  total_meta_tags: number
  technologies_found: number
  cms_detected: boolean
  cms_type: string | null
  cms_version: string | null
  cms_plugins: any[] | null
  cms_themes: any[] | null
  cms_components: any[] | null
  cms_confidence: number
  cms_detection_method: string | null
  cms_metadata: any | null
  technologies: any[] | null
  technologies_confidence: number
  technologies_detection_method: string | null
  technologies_metadata: any | null
  total_html_content: number
  average_html_per_page: number
}

export interface CmsPlugin {
  name: string
  version: string | null
  active: boolean
  path: string | null
  description: string | null
  author: string | null
  confidence: number
  detection_method: string
}

export interface CmsTheme {
  name: string
  version: string | null
  active: boolean
  path: string | null
  description: string | null
  author: string | null
  confidence: number
  detection_method: string
}

export interface CmsComponent {
  name: string
  type: string
  version: string | null
  active: boolean
  path: string | null
  description: string | null
  confidence: number
  detection_method: string
}

export interface Technology {
  name: string
  version: string | null
  category: string
  confidence: number
  detection_method: string
  description: string | null
  website: string | null
  icon: string | null
  first_seen: string | null
  last_seen: string | null
}
