'use client'

export interface DetectedKey {
  id: string
  type: string
  key: string
  location: string
  status: 'exposed' | 'secure' | 'warning'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  pattern: string
  confidence: number
  context?: string
}

export interface KeyDetectionResult {
  keys: DetectedKey[]
  totalKeys: number
  exposedKeys: number
  secureKeys: number
  criticalKeys: number
  highRiskKeys: number
  analysisComplete: boolean
  processingTime: number
}

// Key detection patterns
const keyPatterns = {
  // Google Analytics & Tag Manager
  googleAnalytics: {
    pattern: /(?:GA_MEASUREMENT_ID|gtag|analytics|gtm)['"]?\s*[:=]\s*['"]?([A-Z0-9-]+)['"]?/gi,
    type: 'Google Analytics ID',
    severity: 'medium' as const,
    description: 'Google Analytics tracking ID'
  },
  
  googleTagManager: {
    pattern: /GTM-[A-Z0-9]+/gi,
    type: 'Google Tag Manager ID',
    severity: 'medium' as const,
    description: 'Google Tag Manager container ID'
  },
  
  // API Keys
  openaiApiKey: {
    pattern: /sk-[A-Za-z0-9]{48}/gi,
    type: 'OpenAI API Key',
    severity: 'critical' as const,
    description: 'OpenAI API key - should be kept secret'
  },
  
  stripeApiKey: {
    pattern: /(?:sk_|pk_)[A-Za-z0-9]{24,}/gi,
    type: 'Stripe API Key',
    severity: 'critical' as const,
    description: 'Stripe payment API key'
  },
  
  awsAccessKey: {
    pattern: /AKIA[0-9A-Z]{16}/gi,
    type: 'AWS Access Key',
    severity: 'critical' as const,
    description: 'AWS access key ID'
  },
  
  awsSecretKey: {
    pattern: /[A-Za-z0-9/+=]{40}/gi,
    type: 'AWS Secret Key',
    severity: 'critical' as const,
    description: 'AWS secret access key'
  },
  
  // Database credentials
  databaseUrl: {
    pattern: /(?:postgresql|mysql|mongodb):\/\/[^:]+:[^@]+@[^\/]+\/[^\s'"]+/gi,
    type: 'Database URL',
    severity: 'critical' as const,
    description: 'Database connection string with credentials'
  },
  
  // JWT tokens
  jwtToken: {
    pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/gi,
    type: 'JWT Token',
    severity: 'high' as const,
    description: 'JSON Web Token'
  },
  
  // Social media keys
  facebookAppId: {
    pattern: /(?:fb_app_id|facebook_app_id)['"]?\s*[:=]\s*['"]?(\d{15,16})['"]?/gi,
    type: 'Facebook App ID',
    severity: 'medium' as const,
    description: 'Facebook application ID'
  },
  
  twitterApiKey: {
    pattern: /(?:twitter_api_key|twitter_consumer_key)['"]?\s*[:=]\s*['"]?([A-Za-z0-9]{25,})['"]?/gi,
    type: 'Twitter API Key',
    severity: 'high' as const,
    description: 'Twitter API consumer key'
  },
  
  // Generic API keys
  genericApiKey: {
    pattern: /(?:api_key|apikey|access_token)['"]?\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})['"]?/gi,
    type: 'Generic API Key',
    severity: 'high' as const,
    description: 'Generic API key or access token'
  },
  
  // Tracking codes
  clickcease: {
    pattern: /clickcease\.com\/monitor\/stat\.js/gi,
    type: 'ClickCease Tracking',
    severity: 'low' as const,
    description: 'ClickCease bot protection tracking code'
  },
  
  hotjar: {
    pattern: /(?:hotjar|hj)['"]?\s*[:=]\s*['"]?(\d{6,})['"]?/gi,
    type: 'Hotjar Tracking',
    severity: 'low' as const,
    description: 'Hotjar analytics tracking ID'
  },
  
  // Random long strings (potential keys)
  randomLongString: {
    pattern: /[A-Za-z0-9+/=]{32,}/gi,
    type: 'Potential Secret',
    severity: 'medium' as const,
    description: 'Long random string that might be a secret key'
  }
}

// Function to extract context around a found key
function extractContext(html: string, match: RegExpExecArray, contextLength: number = 100): string {
  const start = Math.max(0, match.index - contextLength)
  const end = Math.min(html.length, match.index + match[0].length + contextLength)
  return html.substring(start, end).replace(/\s+/g, ' ').trim()
}

// Function to determine if a key is exposed or secure
function determineKeyStatus(key: string, context: string): 'exposed' | 'secure' | 'warning' {
  const lowerContext = context.toLowerCase()
  
  // Check for common secure patterns
  if (lowerContext.includes('environment') || 
      lowerContext.includes('process.env') ||
      lowerContext.includes('config') ||
      lowerContext.includes('secret') ||
      lowerContext.includes('private')) {
    return 'secure'
  }
  
  // Check for exposed patterns
  if (lowerContext.includes('console.log') ||
      lowerContext.includes('alert') ||
      lowerContext.includes('document.write') ||
      lowerContext.includes('innerhtml')) {
    return 'exposed'
  }
  
  // Default to warning for unknown cases
  return 'warning'
}

// Function to check if a key is a false positive
function isFalsePositive(key: string, context: string): boolean {
  const lowerKey = key.toLowerCase()
  const lowerContext = context.toLowerCase()
  
  // Skip file paths and URLs
  if (lowerKey.includes('/') || 
      lowerKey.includes('http') || 
      lowerKey.includes('www.') ||
      lowerKey.includes('.com') ||
      lowerKey.includes('.css') ||
      lowerKey.includes('.js') ||
      lowerKey.includes('.png') ||
      lowerKey.includes('.jpg') ||
      lowerKey.includes('.svg') ||
      lowerKey.includes('assets/') ||
      lowerKey.includes('themes/') ||
      lowerKey.includes('plugins/') ||
      lowerKey.includes('wp-content/') ||
      lowerKey.includes('node_modules/') ||
      lowerKey.includes('vendor/')) {
    return true
  }
  
  // Skip common words that aren't keys
  const commonWords = ['test', 'example', 'demo', 'sample', 'placeholder', 'default', 'admin', 'user', 'guest']
  if (commonWords.some(word => lowerKey.includes(word))) {
    return true
  }
  
  return false
}

// Function to calculate confidence score
function calculateConfidence(key: string, type: string, context: string): number {
  let confidence = 0.5 // Base confidence
  
  // Increase confidence for specific patterns
  if (type.includes('API Key') && key.length > 20) confidence += 0.3
  if (type.includes('JWT') && key.includes('.')) confidence += 0.4
  if (type.includes('Google') && key.includes('-')) confidence += 0.3
  
  // Decrease confidence for common words
  const commonWords = ['test', 'example', 'demo', 'sample', 'placeholder']
  if (commonWords.some(word => key.toLowerCase().includes(word))) {
    confidence -= 0.2
  }
  
  return Math.min(1, Math.max(0, confidence))
}

// Main key detection function
export async function detectKeysInHtml(htmlContent: string): Promise<KeyDetectionResult> {
  const startTime = performance.now()
  const detectedKeys: DetectedKey[] = []
  
  if (!htmlContent || htmlContent.length === 0) {
    return {
      keys: [],
      totalKeys: 0,
      exposedKeys: 0,
      secureKeys: 0,
      criticalKeys: 0,
      highRiskKeys: 0,
      analysisComplete: true,
      processingTime: 0
    }
  }
  
  console.log('🔍 Starting key detection analysis...')
  console.log('📊 HTML content length:', htmlContent.length)
  
  // Process each pattern
  for (const [patternName, patternConfig] of Object.entries(keyPatterns)) {
    const regex = new RegExp(patternConfig.pattern.source, patternConfig.pattern.flags)
    let match
    
    while ((match = regex.exec(htmlContent)) !== null) {
      const key = match[1] || match[0]
      const context = extractContext(htmlContent, match)
      
      // Skip if it's a false positive
      if (isFalsePositive(key, context)) continue
      
      const status = determineKeyStatus(key, context)
      const confidence = calculateConfidence(key, patternConfig.type, context)
      
      // Skip if confidence is too low
      if (confidence < 0.3) continue
      
      const detectedKey: DetectedKey = {
        id: `${patternName}_${match.index}_${Date.now()}`,
        type: patternConfig.type,
        key: key.length > 50 ? key.substring(0, 50) + '...' : key,
        location: 'HTML Content',
        status,
        severity: patternConfig.severity,
        description: patternConfig.description,
        pattern: patternName,
        confidence,
        context: context.length > 200 ? context.substring(0, 200) + '...' : context
      }
      
      detectedKeys.push(detectedKey)
      
      // Prevent infinite loops
      if (detectedKeys.length > 100) break
    }
    
    // Reset regex lastIndex
    regex.lastIndex = 0
  }
  
  // Remove duplicates based on key value
  const uniqueKeys = detectedKeys.filter((key, index, self) => 
    index === self.findIndex(k => k.key === key.key && k.type === key.type)
  )
  
  const processingTime = performance.now() - startTime
  
  const result: KeyDetectionResult = {
    keys: uniqueKeys,
    totalKeys: uniqueKeys.length,
    exposedKeys: uniqueKeys.filter(k => k.status === 'exposed').length,
    secureKeys: uniqueKeys.filter(k => k.status === 'secure').length,
    criticalKeys: uniqueKeys.filter(k => k.severity === 'critical').length,
    highRiskKeys: uniqueKeys.filter(k => k.severity === 'critical' || k.severity === 'high').length,
    analysisComplete: true,
    processingTime
  }
  
  console.log('✅ Key detection completed:', {
    totalKeys: result.totalKeys,
    exposedKeys: result.exposedKeys,
    criticalKeys: result.criticalKeys,
    processingTime: `${processingTime.toFixed(2)}ms`
  })
  
  return result
}

// Function to detect keys in multiple pages
export async function detectKeysInPages(pages: Array<{pageName: string, pageUrl: string, pageHtml: string}>): Promise<{
  allKeys: DetectedKey[]
  keysByPage: Record<string, DetectedKey[]>
  summary: KeyDetectionResult
}> {
  console.log('🔍 Starting multi-page key detection...')
  console.log('📊 Total pages to analyze:', pages.length)
  
  const allKeys: DetectedKey[] = []
  const keysByPage: Record<string, DetectedKey[]> = {}
  
  for (const page of pages) {
    if (!page.pageHtml) continue
    
    console.log(`🔍 Analyzing page: ${page.pageName}`)
    const pageResult = await detectKeysInHtml(page.pageHtml)
    
    // Add page information to keys
    const pageKeys = pageResult.keys.map(key => ({
      ...key,
      location: `${page.pageName} (${page.pageUrl})`,
      context: key.context ? `${key.context} [Found in: ${page.pageName}]` : `Found in: ${page.pageName}`
    }))
    
    allKeys.push(...pageKeys)
    keysByPage[page.pageName] = pageKeys
  }
  
  // Remove duplicates across pages
  const uniqueKeys = allKeys.filter((key, index, self) => 
    index === self.findIndex(k => k.key === key.key && k.type === key.type)
  )
  
  const summary: KeyDetectionResult = {
    keys: uniqueKeys,
    totalKeys: uniqueKeys.length,
    exposedKeys: uniqueKeys.filter(k => k.status === 'exposed').length,
    secureKeys: uniqueKeys.filter(k => k.status === 'secure').length,
    criticalKeys: uniqueKeys.filter(k => k.severity === 'critical').length,
    highRiskKeys: uniqueKeys.filter(k => k.severity === 'critical' || k.severity === 'high').length,
    analysisComplete: true,
    processingTime: 0
  }
  
  console.log('✅ Multi-page key detection completed:', {
    totalKeys: summary.totalKeys,
    exposedKeys: summary.exposedKeys,
    criticalKeys: summary.criticalKeys,
    pagesAnalyzed: pages.length
  })
  
  return {
    allKeys: uniqueKeys,
    keysByPage,
    summary
  }
}
