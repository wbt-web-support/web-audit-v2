export interface DetectedTechnology {
  name: string;
  version?: string | null;
  category: string;
  confidence: number;
  detection_method: string;
  description?: string | null;
  website?: string | null;
  icon?: string | null;
}

export interface TechnologyPattern {
  name: string;
  patterns: {
    html?: string[];
    meta?: string[];
    scripts?: string[];
    headers?: string[];
    cookies?: string[];
    css?: string[];
    classes?: string[];
  };
  category: string;
  confidence: number;
  description?: string;
  website?: string;
}

const TECHNOLOGY_PATTERNS: TechnologyPattern[] = [
  {
    name: 'WordPress',
    patterns: {
      html: ['wp-content', 'wp-includes', 'wp-admin'],
      meta: ['generator.*WordPress']
    },
    category: 'cms',
    confidence: 0.95,
    description: 'Content Management System',
    website: 'https://wordpress.org'
  },
  {
    name: 'Shopify',
    patterns: {
      html: ['cdn.shopify.com', 'Shopify.theme', 'shopify-section'],
      meta: ['shopify-digital-wallet']
    },
    category: 'ecommerce',
    confidence: 0.95,
    description: 'E-commerce Platform',
    website: 'https://shopify.com'
  },
  {
    name: 'Wix',
    patterns: {
      html: ['wix.com', 'wixapps.net', 'wixstatic.com'],
      headers: ['X-Wix-Renderer-Server']
    },
    category: 'website_builder',
    confidence: 0.9,
    description: 'Website Builder',
    website: 'https://wix.com'
  },
  {
    name: 'Squarespace',
    patterns: {
      html: ['static.squarespace.com', 'sqs-block', 'sqs-system-data']
    },
    category: 'website_builder',
    confidence: 0.9,
    description: 'Website Builder',
    website: 'https://squarespace.com'
  },
  {
    name: 'React',
    patterns: {
      html: ['data-reactroot', 'react-dom'],
      scripts: ['__REACT_DEVTOOLS_GLOBAL_HOOK__']
    },
    category: 'javascript_framework',
    confidence: 0.9,
    description: 'JavaScript Library',
    website: 'https://reactjs.org'
  },
  {
    name: 'Next.js',
    patterns: {
      html: ['__NEXT_DATA__', '_next/static/'],
      scripts: ['__NEXT_DATA__']
    },
    category: 'javascript_framework',
    confidence: 0.95,
    description: 'React Framework',
    website: 'https://nextjs.org'
  },
  {
    name: 'Vue.js',
    patterns: {
      html: ['data-v-', 'vue-meta'],
      scripts: ['Vue.config', 'vue.min.js']
    },
    category: 'javascript_framework',
    confidence: 0.9,
    description: 'JavaScript Framework',
    website: 'https://vuejs.org'
  },
  {
    name: 'Angular',
    patterns: {
      html: ['ng-version', 'ng-app'],
      scripts: ['angular.min.js', 'angular.js']
    },
    category: 'javascript_framework',
    confidence: 0.9,
    description: 'JavaScript Framework',
    website: 'https://angular.io'
  },
  {
    name: 'Bootstrap',
    patterns: {
      css: ['bootstrap.min.css', 'bootstrap.css'],
      scripts: ['bootstrap.bundle.js', 'bootstrap.min.js']
    },
    category: 'css_framework',
    confidence: 0.9,
    description: 'CSS Framework',
    website: 'https://getbootstrap.com'
  },
  {
    name: 'Tailwind CSS',
    patterns: {
      classes: ['text-', 'bg-', 'flex', 'grid', 'p-', 'm-', 'w-', 'h-']
    },
    category: 'css_framework',
    confidence: 0.8,
    description: 'Utility-first CSS Framework',
    website: 'https://tailwindcss.com'
  },
  {
    name: 'Google Analytics',
    patterns: {
      scripts: ['gtag', 'analytics.js', 'googletagmanager.com/gtag/js']
    },
    category: 'analytics',
    confidence: 0.95,
    description: 'Web Analytics',
    website: 'https://analytics.google.com'
  },
  {
    name: 'Google Tag Manager',
    patterns: {
      scripts: ['googletagmanager.com/gtm.js']
    },
    category: 'analytics',
    confidence: 0.95,
    description: 'Tag Management System',
    website: 'https://tagmanager.google.com'
  },
  {
    name: 'Facebook Pixel',
    patterns: {
      scripts: ['fbq', 'connect.facebook.net/en_US/fbevents.js']
    },
    category: 'analytics',
    confidence: 0.9,
    description: 'Facebook Analytics',
    website: 'https://developers.facebook.com'
  },
  {
    name: 'jQuery',
    patterns: {
      scripts: ['jquery.min.js', 'jQuery(', '$(document).ready']
    },
    category: 'javascript_library',
    confidence: 0.9,
    description: 'JavaScript Library',
    website: 'https://jquery.com'
  },
  {
    name: 'Cloudflare',
    patterns: {
      html: ['cdn-cgi'],
      headers: ['server: cloudflare']
    },
    category: 'cdn',
    confidence: 0.95,
    description: 'Content Delivery Network',
    website: 'https://cloudflare.com'
  },
  {
    name: 'Nginx',
    patterns: {
      headers: ['server: nginx']
    },
    category: 'web_server',
    confidence: 0.9,
    description: 'Web Server',
    website: 'https://nginx.org'
  },
  {
    name: 'Apache',
    patterns: {
      headers: ['server: apache']
    },
    category: 'web_server',
    confidence: 0.9,
    description: 'Web Server',
    website: 'https://apache.org'
  },
  {
    name: 'Express.js',
    patterns: {
      headers: ['x-powered-by: express']
    },
    category: 'web_framework',
    confidence: 0.9,
    description: 'Node.js Web Framework',
    website: 'https://expressjs.com'
  },
  {
    name: 'Laravel',
    patterns: {
      headers: ['x-powered-by: php'],
      cookies: ['laravel_session']
    },
    category: 'web_framework',
    confidence: 0.9,
    description: 'PHP Web Framework',
    website: 'https://laravel.com'
  },
  {
    name: 'Drupal',
    patterns: {
      html: ['sites/default/files'],
      meta: ['generator.*Drupal']
    },
    category: 'cms',
    confidence: 0.9,
    description: 'Content Management System',
    website: 'https://drupal.org'
  }
];

export function detectTechnologiesFromHTML(htmlContent: string, headers?: Record<string, string>, cookies?: string[]): DetectedTechnology[] {
  const detectedTechnologies: DetectedTechnology[] = [];
  const htmlLower = htmlContent.toLowerCase();
  
  for (const pattern of TECHNOLOGY_PATTERNS) {
    let confidence = 0;
    let detectionMethod = '';
    let version: string | null = null;
    
    // Check HTML patterns
    if (pattern.patterns.html) {
      for (const htmlPattern of pattern.patterns.html) {
        if (htmlLower.includes(htmlPattern.toLowerCase())) {
          confidence = Math.max(confidence, pattern.confidence);
          detectionMethod = 'html_content';
        }
      }
    }
    
    // Check meta tag patterns
    if (pattern.patterns.meta) {
      for (const metaPattern of pattern.patterns.meta) {
        const regex = new RegExp(metaPattern, 'i');
        if (regex.test(htmlContent)) {
          confidence = Math.max(confidence, pattern.confidence);
          detectionMethod = 'meta_tags';
          
          // Try to extract version from meta tag
          const versionMatch = htmlContent.match(new RegExp(`content="[^"]*${pattern.name}[^"]*?([0-9.]+)`, 'i'));
          if (versionMatch) {
            version = versionMatch[1];
          }
        }
      }
    }
    
    // Check script patterns
    if (pattern.patterns.scripts) {
      for (const scriptPattern of pattern.patterns.scripts) {
        if (htmlLower.includes(scriptPattern.toLowerCase())) {
          confidence = Math.max(confidence, pattern.confidence);
          detectionMethod = 'javascript';
        }
      }
    }
    
    // Check CSS patterns
    if (pattern.patterns.css) {
      for (const cssPattern of pattern.patterns.css) {
        if (htmlLower.includes(cssPattern.toLowerCase())) {
          confidence = Math.max(confidence, pattern.confidence);
          detectionMethod = 'css_links';
        }
      }
    }
    
    // Check class patterns (for Tailwind CSS)
    if (pattern.patterns.classes) {
      let classMatches = 0;
      for (const classPattern of pattern.patterns.classes) {
        const regex = new RegExp(`class="[^"]*${classPattern}[^"]*"`, 'gi');
        const matches = htmlContent.match(regex);
        if (matches) {
          classMatches += matches.length;
        }
      }
      if (classMatches >= 3) { // Require at least 3 class matches for confidence
        confidence = Math.max(confidence, pattern.confidence * (Math.min(classMatches / 10, 1))); // Scale confidence based on matches
        detectionMethod = 'css_classes';
      }
    }
    
    // Check headers
    if (headers && pattern.patterns.headers) {
      for (const headerPattern of pattern.patterns.headers) {
        const [headerName, headerValue] = headerPattern.split(': ');
        if (headers[headerName.toLowerCase()] && headers[headerName.toLowerCase()].toLowerCase().includes(headerValue.toLowerCase())) {
          confidence = Math.max(confidence, pattern.confidence);
          detectionMethod = 'http_headers';
        }
      }
    }
    
    // Check cookies
    if (cookies && pattern.patterns.cookies) {
      for (const cookiePattern of pattern.patterns.cookies) {
        if (cookies.some(cookie => cookie.toLowerCase().includes(cookiePattern.toLowerCase()))) {
          confidence = Math.max(confidence, pattern.confidence);
          detectionMethod = 'cookies';
        }
      }
    }
    
    // Only add if we have sufficient confidence
    if (confidence >= 0.5) {
      detectedTechnologies.push({
        name: pattern.name,
        version,
        category: pattern.category,
        confidence,
        detection_method: detectionMethod,
        description: pattern.description,
        website: pattern.website,
        icon: null
      });
    }
  }
  
  // Sort by confidence (highest first)
  return detectedTechnologies.sort((a, b) => b.confidence - a.confidence);
}

export function categorizeTechnologies(technologies: DetectedTechnology[]): Record<string, DetectedTechnology[]> {
  const categorized: Record<string, DetectedTechnology[]> = {};
  
  for (const tech of technologies) {
    if (!categorized[tech.category]) {
      categorized[tech.category] = [];
    }
    categorized[tech.category].push(tech);
  }
  
  return categorized;
}

export function getTechnologyStats(technologies: DetectedTechnology[]) {
  const categories = categorizeTechnologies(technologies);
  const totalTechnologies = technologies.length;
  const categoriesCount = Object.keys(categories).length;
  const highConfidenceCount = technologies.filter(tech => tech.confidence >= 0.8).length;
  const averageConfidence = technologies.length > 0 
    ? technologies.reduce((sum, tech) => sum + tech.confidence, 0) / technologies.length 
    : 0;
  
  return {
    totalTechnologies,
    categoriesCount,
    highConfidenceCount,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    categories
  };
}
