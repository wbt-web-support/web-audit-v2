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
  // Meta tags data storage
  meta_tags_data: MetaTagsData | null
  social_meta_tags_data: SocialMetaTagsData | null
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  fix: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOHighlight {
  type: 'achievement' | 'good-practice' | 'optimization'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOAnalysisResult {
  score: number
  issues: SEOIssue[]
  highlights: SEOHighlight[]
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    info: number
    totalHighlights: number
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

// Meta tags data interfaces
export interface MetaTag {
  name: string
  content: string
  property?: string
  httpEquiv?: string
  charset?: string
}

export interface MetaTagsData {
  all_meta_tags: MetaTag[]
  standard_meta_tags: {
    title?: string
    description?: string
    keywords?: string
    author?: string
    robots?: string
    viewport?: string
    charset?: string
    language?: string
    generator?: string
    rating?: string
    distribution?: string
    copyright?: string
    reply_to?: string
    owner?: string
    url?: string
    identifier_url?: string
    category?: string
    coverage?: string
    target?: string
    handheld_friendly?: string
    mobile_optimized?: string
    apple_mobile_web_app_capable?: string
    apple_mobile_web_app_status_bar_style?: string
    apple_mobile_web_app_title?: string
    format_detection?: string
    theme_color?: string
    msapplication_tilecolor?: string
    msapplication_config?: string
  }
  http_equiv_tags: MetaTag[]
  custom_meta_tags: MetaTag[]
  total_count: number
  pages_with_meta_tags: number
  average_meta_tags_per_page: number
}

export interface SocialMetaTagsData {
  open_graph: {
    title?: string
    description?: string
    image?: string
    url?: string
    type?: string
    site_name?: string
    locale?: string
    updated_time?: string
    article_author?: string
    article_section?: string
    article_tag?: string
    article_published_time?: string
    article_modified_time?: string
    book_author?: string
    book_isbn?: string
    book_release_date?: string
    book_tag?: string
    profile_first_name?: string
    profile_last_name?: string
    profile_username?: string
    profile_gender?: string
    music_duration?: string
    music_album?: string
    music_musician?: string
    video_actor?: string
    video_director?: string
    video_writer?: string
    video_duration?: string
    video_release_date?: string
    video_tag?: string
    video_series?: string
  }
  twitter: {
    card?: string
    site?: string
    creator?: string
    title?: string
    description?: string
    image?: string
    image_alt?: string
    player?: string
    player_width?: string
    player_height?: string
    player_stream?: string
    app_name_iphone?: string
    app_id_iphone?: string
    app_url_iphone?: string
    app_name_ipad?: string
    app_id_ipad?: string
    app_url_ipad?: string
    app_name_googleplay?: string
    app_id_googleplay?: string
    app_url_googleplay?: string
  }
  linkedin: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
  pinterest: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
  whatsapp: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
  telegram: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
  discord: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
  slack: {
    title?: string
    description?: string
    image?: string
    url?: string
  }
  total_social_tags: number
  social_meta_tags_count: number
  platforms_detected: string[]
  completeness_score: number
  missing_platforms: string[]
}
