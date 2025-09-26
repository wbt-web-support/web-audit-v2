import { AuditProject } from '@/types/audit'

export interface ScrapedPage {
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
  links: Array<{ url: string; text: string; title?: string }> | null
  images: Array<{ src: string; alt?: string; title?: string }> | null
  meta_tags_count: number
  technologies_count: number
  technologies: string[] | null
  cms_type: string | null
  cms_version: string | null
  cms_plugins: string[] | null
  social_meta_tags: Record<string, string> | null
  social_meta_tags_count: number
  is_external: boolean
  response_time: number | null
  performance_analysis: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AnalysisTabProps {
  projectId: string
  cachedData?: {
    project: AuditProject | null
    scrapedPages: ScrapedPage[]
    lastFetchTime: number
  } | null
  onDataUpdate?: (project: AuditProject | null, scrapedPages: ScrapedPage[]) => void
  onPageSelect?: (pageId: string) => void
}

export interface AnalysisTabState {
  project: AuditProject | null
  scrapedPages: ScrapedPage[]
  loading: boolean
  error: string | null
  activeSection: string
  dataFetched: boolean
  lastFetchTime: number
  isScraping: boolean
  scrapingError: string | null
  isPageSpeedLoading: boolean
  hasAutoStartedPageSpeed: boolean
  loadedSections: Set<string>
  scrapedPagesLoaded: boolean
  hasAutoStartedSeoAnalysis: boolean
  dataVersion: number
  isRefreshing: boolean
}

export interface PageAnalysisResult {
  totalKeys: number
  keyTypes: Record<string, number>
  detectedKeys: Array<{
    type: string
    name: string
    value: string
    confidence: string
  }>
  patterns: Array<{
    name: string
    pattern: RegExp
    type: string
  }>
  suspiciousText: Array<{
    type: string
    name: string
    value: string
    confidence: string
  }>
  analysisTimestamp: string
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

export interface CmsData {
  cms_type: string | null
  cms_version: string | null
  cms_plugins: CmsPlugin[] | null
  cms_themes: CmsTheme[] | null
  cms_components: CmsComponent[] | null
  cms_confidence: number
  cms_detection_method: string | null
  cms_metadata: Record<string, unknown>
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
  first_seen: string
  last_seen: string
}

export interface TechnologiesData {
  technologies: Technology[] | null
  technologies_confidence: number
  technologies_detection_method: string | null
  technologies_metadata: Record<string, unknown>
}
