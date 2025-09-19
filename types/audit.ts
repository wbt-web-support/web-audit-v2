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
  pagespeed_insights_data: PageSpeedInsightsData | null
  pagespeed_insights_loading: boolean
  pagespeed_insights_error: string | null
  scraping_data: any | null
  seo_analysis: SEOAnalysisResult | null
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  fix: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOAnalysisResult {
  score: number
  issues: SEOIssue[]
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    info: number
  }
  recommendations: string[]
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

export interface PageSpeedInsightsData {
  lighthouseResult: {
    categories: {
      performance: {
        score: number
        title: string
      }
      accessibility: {
        score: number
        title: string
      }
      'best-practices': {
        score: number
        title: string
      }
      seo: {
        score: number
        title: string
      }
    }
    audits: {
      'first-contentful-paint': {
        displayValue: string
        score: number
        title: string
      }
      'largest-contentful-paint': {
        displayValue: string
        score: number
        title: string
      }
      'cumulative-layout-shift': {
        displayValue: string
        score: number
        title: string
      }
      'speed-index': {
        displayValue: string
        score: number
        title: string
      }
      'total-blocking-time': {
        displayValue: string
        score: number
        title: string
      }
      'interactive': {
        displayValue: string
        score: number
        title: string
      }
      'max-potential-fid'?: {
        displayValue: string
        score: number
        title: string
      }
      'server-response-time'?: {
        displayValue: string
        score: number
        title: string
      }
      'total-byte-weight'?: {
        displayValue: string
        score: number
        title: string
      }
      'dom-size'?: {
        displayValue: string
        score: number
        title: string
      }
      [key: string]: {
        displayValue: string
        score: number
        title: string
      } | undefined
    }
    configSettings: {
      formFactor: string
      locale: string
    }
    fetchTime: string
    finalUrl: string
    runWarnings: string[]
    userAgent: string
    fullPageScreenshot?: {
      data: string
      mime_type: string
      width: number
      height: number
    }
    screenshots?: {
      data: string
      mime_type: string
      width: number
      height: number
    }
  }
  loadingExperience: {
    metrics: {
      'FIRST_CONTENTFUL_PAINT_MS': {
        category: string
        distributions: Array<{
          min: number
          max: number
          proportion: number
        }>
        percentile: number
      }
      'LARGEST_CONTENTFUL_PAINT_MS': {
        category: string
        distributions: Array<{
          min: number
          max: number
          proportion: number
        }>
        percentile: number
      }
      'CUMULATIVE_LAYOUT_SHIFT_SCORE': {
        category: string
        distributions: Array<{
          min: number
          max: number
          proportion: number
        }>
        percentile: number
      }
    }
    overall_category: string
  }
  version: {
    major: number
    minor: number
  }
}
