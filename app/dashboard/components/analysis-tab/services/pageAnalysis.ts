import { PageAnalysisResult } from '../types'

export function analyzePageForKeys(htmlContent: string): PageAnalysisResult {
  if (!htmlContent) {
    return {
      totalKeys: 0,
      keyTypes: {},
      detectedKeys: [],
      patterns: [],
      suspiciousText: [],
      analysisTimestamp: new Date().toISOString()
    }
  }

  const detectedKeys: Array<{
    type: string
    name: string
    value: string
    confidence: string
  }> = []
  const keyTypes: Record<string, number> = {}
  const patterns: Array<{
    name: string
    pattern: RegExp
    type: string
  }> = []
  const suspiciousText: Array<{
    type: string
    name: string
    value: string
    confidence: string
  }> = []

  // 1. Google Tag Manager (GTM) patterns
  const gtmScriptPattern = /\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start':/g
  const gtmIdPattern = /GTM-[A-Z0-9]+/g
  const gtmJsPattern = /googletagmanager\.com\/gtm\.js/g
  const gtmNoscriptPattern = /<iframe[^>]+src=["']https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-[A-Z0-9]+/gi

  // 2. Google Analytics (gtag.js) patterns
  const gtagJsPattern = /googletagmanager\.com\/gtag\/js/g
  const gaIdPattern = /GA-[A-Z0-9-]+/g
  const gtagIdPattern = /gtag\('config',\s*'[A-Z0-9-]+'/g

  // 3. Facebook Pixel patterns
  const fbPixelPattern = /facebook\.net\/tr\?id=\d+/g
  const fbPixelIdPattern = /fbq\('init',\s*'\d+'/g

  // 4. ClickCease patterns
  const clickceaseScriptPattern = /clickcease\.com\/monitor\/stat\.js/g
  const clickceaseNoscriptImgPattern = /<img[^>]+src=['"]https:\/\/monitor\.clickcease\.com\/stats\/stats\.aspx/gi

  // 5. API Keys and tokens patterns
  const apiKeyPattern = /(api[_-]?key|apikey|access[_-]?token|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})['"]?/gi
  const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
  const stripeKeyPattern = /(pk_|sk_)[a-zA-Z0-9]{24,}/g
  const paypalKeyPattern = /(AKIA|ASIA)[A-Z0-9]{16}/g

  // 6. Social media tracking patterns
  const twitterPixelPattern = /pixel\.twitter\.com\/i\/adsct/g
  const linkedinPixelPattern = /snap\.licdn\.com\/li\.lms/g
  const pinterestPixelPattern = /pintrk\.com\/track/g

  // 7. Random long strings (potential keys)
  const randomStringPattern = /\b[A-Za-z0-9_-]{20,}\b/g

  // 8. Email patterns (might contain sensitive info)
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

  // Analyze patterns
  const patternsToCheck = [
    { name: 'GTM Script', pattern: gtmScriptPattern, type: 'tracking' },
    { name: 'GTM ID', pattern: gtmIdPattern, type: 'tracking' },
    { name: 'GTM JS', pattern: gtmJsPattern, type: 'tracking' },
    { name: 'GTM Noscript', pattern: gtmNoscriptPattern, type: 'tracking' },
    { name: 'Google Analytics', pattern: gtagJsPattern, type: 'analytics' },
    { name: 'GA ID', pattern: gaIdPattern, type: 'analytics' },
    { name: 'Gtag ID', pattern: gtagIdPattern, type: 'analytics' },
    { name: 'Facebook Pixel', pattern: fbPixelPattern, type: 'tracking' },
    { name: 'Facebook Pixel ID', pattern: fbPixelIdPattern, type: 'tracking' },
    { name: 'ClickCease Script', pattern: clickceaseScriptPattern, type: 'security' },
    { name: 'ClickCease Noscript', pattern: clickceaseNoscriptImgPattern, type: 'security' },
    { name: 'API Key', pattern: apiKeyPattern, type: 'api' },
    { name: 'JWT Token', pattern: jwtPattern, type: 'token' },
    { name: 'Stripe Key', pattern: stripeKeyPattern, type: 'payment' },
    { name: 'PayPal Key', pattern: paypalKeyPattern, type: 'payment' },
    { name: 'Twitter Pixel', pattern: twitterPixelPattern, type: 'tracking' },
    { name: 'LinkedIn Pixel', pattern: linkedinPixelPattern, type: 'tracking' },
    { name: 'Pinterest Pixel', pattern: pinterestPixelPattern, type: 'tracking' },
    { name: 'Email', pattern: emailPattern, type: 'contact' }
  ]

  patternsToCheck.forEach(({ name, pattern, type }) => {
    const matches = htmlContent.match(pattern)
    if (matches) {
      matches.forEach(match => {
        detectedKeys.push({
          type: type,
          name: name,
          value: match,
          confidence: 'high'
        })
      })
      
      if (!keyTypes[type]) keyTypes[type] = 0
      keyTypes[type] += matches.length
    }
  })

  // Check for random long strings
  const randomMatches = htmlContent.match(randomStringPattern)
  if (randomMatches) {
    randomMatches.forEach(match => {
      // Filter out common patterns and check if it looks like a key
      if (match.length >= 20 && 
          !match.includes('http') && 
          !match.includes('www') && 
          !match.includes('@') &&
          !match.includes('.') &&
          /[A-Z]/.test(match) && 
          /[a-z]/.test(match) && 
          /[0-9]/.test(match)) {
        
        suspiciousText.push({
          type: 'suspicious',
          name: 'Random String',
          value: match,
          confidence: 'medium'
        })
      }
    })
  }

  return {
    totalKeys: detectedKeys.length + suspiciousText.length,
    keyTypes: keyTypes,
    detectedKeys: detectedKeys,
    patterns: patterns,
    suspiciousText: suspiciousText,
    analysisTimestamp: new Date().toISOString()
  }
}
