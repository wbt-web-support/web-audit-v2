// Feature constants and types for the web audit platform

export interface Feature {
  id: string
  name: string
  description: string
  category: 'crawling' | 'content' | 'security' | 'media' | 'technical'
  icon: string
  isCore: boolean // Core features that should be available to all plans
}

export const FEATURES: Feature[] = [
  // Website Crawling
  {
    id: 'single_page_crawl',
    name: 'Single Page Crawl',
    description: 'Analyze one specific page',
    category: 'crawling',
    icon: '🔍',
    isCore: true
  },
  {
    id: 'full_site_crawl',
    name: 'Full Site Crawl',
    description: 'Scan and audit all accessible pages',
    category: 'crawling',
    icon: '🕷️',
    isCore: false
  },
  {
    id: 'hidden_urls_detection',
    name: 'Hidden URLs Detection',
    description: 'Identify unlinked or orphan pages',
    category: 'crawling',
    icon: '🔎',
    isCore: false
  },

  // Content & Brand Insights
  {
    id: 'brand_consistency_check',
    name: 'Brand Consistency Check',
    description: 'Ensure colors, fonts, and messaging align with brand guidelines',
    category: 'content',
    icon: '🎨',
    isCore: false
  },
  {
    id: 'grammar_content_analysis',
    name: 'Grammar & Content Analysis',
    description: 'Check for spelling, grammar, readability, and tone',
    category: 'content',
    icon: '📝',
    isCore: true
  },
  {
    id: 'seo_structure',
    name: 'SEO & Structure',
    description: 'Validate meta tags, heading hierarchy, schema markup, and keyword usage',
    category: 'content',
    icon: '📊',
    isCore: false
  },

  // Security & Compliance
  {
    id: 'stripe_key_detection',
    name: 'Stripe Public Key Detection',
    description: 'Identify exposed API keys',
    category: 'security',
    icon: '🔐',
    isCore: false
  },
  {
    id: 'google_tags_audit',
    name: 'Google Tags & Tracking Audit',
    description: 'Detect Google Analytics, Tag Manager, and third-party scripts',
    category: 'security',
    icon: '📈',
    isCore: false
  },

  // Media & Asset Analysis
  {
    id: 'image_scan',
    name: 'On-Site Image Scan',
    description: 'Check alt tags, resolution, compression, and broken images',
    category: 'media',
    icon: '🖼️',
    isCore: true
  },
  {
    id: 'link_scanner',
    name: 'Link Scanner',
    description: 'Validate internal/external links and detect broken redirects',
    category: 'media',
    icon: '🔗',
    isCore: true
  },
  {
    id: 'social_share_preview',
    name: 'Social Share Preview',
    description: 'Generate how the site appears on platforms like Twitter, LinkedIn, and Facebook',
    category: 'media',
    icon: '📱',
    isCore: false
  },

  // Technical & Performance
  {
    id: 'performance_metrics',
    name: 'Performance Metrics',
    description: 'Page load time, Core Web Vitals, resource optimization',
    category: 'technical',
    icon: '⚡',
    isCore: true
  },
  {
    id: 'ui_ux_quality_check',
    name: 'UI/UX Quality Check',
    description: 'Detect layout issues, responsiveness, and accessibility gaps',
    category: 'technical',
    icon: '🎯',
    isCore: false
  },
  {
    id: 'technical_fix_recommendations',
    name: 'Technical Fix Recommendations',
    description: 'Actionable suggestions for speed, accessibility, and SEO',
    category: 'technical',
    icon: '🔧',
    isCore: false
  },
  {
    id: 'technical_analysis',
    name: 'Technical Analysis',
    description: 'Comprehensive technical audit including code quality, structure, and best practices',
    category: 'technical',
    icon: '⚙️',
    isCore: false
  },

  // Additional features to reach 17
  {
    id: 'accessibility_audit',
    name: 'Accessibility Audit',
    description: 'Comprehensive accessibility compliance checking',
    category: 'technical',
    icon: '♿',
    isCore: false
  },
  {
    id: 'mobile_responsiveness',
    name: 'Mobile Responsiveness',
    description: 'Test and validate mobile-friendly design',
    category: 'technical',
    icon: '📱',
    isCore: false
  },
  {
    id: 'page_speed_analysis',
    name: 'Page Speed Analysis',
    description: 'Detailed page loading performance analysis',
    category: 'technical',
    icon: '🚀',
    isCore: true
  },
  {
    id: 'broken_links_check',
    name: 'Broken Links Check',
    description: 'Find and report broken internal and external links',
    category: 'media',
    icon: '🔗',
    isCore: true
  }
]

export const FEATURE_CATEGORIES = {
  crawling: 'Website Crawling',
  content: 'Content & Brand Insights',
  security: 'Security & Compliance',
  media: 'Media & Asset Analysis',
  technical: 'Technical & Performance'
}

export const getFeaturesByCategory = (category: string) => {
  return FEATURES.filter(feature => feature.category === category)
}

export const getCoreFeatures = () => {
  return FEATURES.filter(feature => feature.isCore)
}

export const getFeatureById = (id: string) => {
  return FEATURES.find(feature => feature.id === id)
}

export const validateFeatureIds = (featureIds: string[]) => {
  const validIds = FEATURES.map(f => f.id)
  return featureIds.every(id => validIds.includes(id))
}
