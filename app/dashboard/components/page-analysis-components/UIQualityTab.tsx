'use client'

interface UIQualityTabProps {
  page: {
    html_content: string | null
  }
}

interface QualityMetric {
  name: string
  value: number
  max: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
}

interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'accessibility' | 'performance' | 'structure' | 'modern-standards'
  impact: string
}

export default function UIQualityTab({ page }: UIQualityTabProps) {
  const content = page.html_content || ''
  
  // Comprehensive HTML Structure Analysis
  const hasViewport = content.includes('viewport')
  const hasResponsiveDesign = content.includes('responsive') || content.includes('mobile') || content.includes('@media')
  const hasCSS = content.includes('<style') || content.includes('stylesheet')
  const hasJavaScript = content.includes('<script')
  const hasForms = content.includes('<form')
  const hasButtons = content.includes('<button') || content.includes('type="submit"')
  const hasInputs = content.includes('<input')
  const hasLabels = content.includes('<label')
  
  // Count interactive elements
  const formCount = (content.match(/<form[^>]*>/gi) || []).length
  const buttonCount = (content.match(/<button[^>]*>/gi) || []).length
  const inputCount = (content.match(/<input[^>]*>/gi) || []).length
  const labelCount = (content.match(/<label[^>]*>/gi) || []).length
  const imageCount = (content.match(/<img[^>]*>/gi) || []).length
  const linkCount = (content.match(/<a[^>]*>/gi) || []).length
  const headingCount = (content.match(/<h[1-6][^>]*>/gi) || []).length
  
  // Advanced Structure Analysis
  const hasSemanticHTML = content.includes('<header') || content.includes('<nav') || content.includes('<main') || content.includes('<section') || content.includes('<article') || content.includes('<footer')
  const hasProperHeadingStructure = content.includes('<h1') && content.includes('<h2')
  const hasListElements = content.includes('<ul') || content.includes('<ol')
  const hasTableElements = content.includes('<table')
  
  // Accessibility Analysis
  const hasAltText = content.includes('alt=')
  const hasTitleAttributes = content.includes('title=')
  const hasAriaLabels = content.includes('aria-label') || content.includes('aria-labelledby')
  const hasRoleAttributes = content.includes('role=')
  const hasTabIndex = content.includes('tabindex')
  const hasLangAttribute = content.includes('lang=')
  
  // Code Quality Analysis
  const hasInlineStyles = content.includes('style=')
  const hasInlineScripts = content.includes('<script>')
  const hasDeprecatedTags = content.includes('<center>') || content.includes('<font>') || content.includes('<marquee>') || content.includes('<blink>')
  const hasExternalCSS = content.includes('rel="stylesheet"')
  const hasExternalJS = content.includes('src=') && content.includes('<script')
  
  // Performance Indicators
  const hasLazyLoading = content.includes('loading="lazy"')
  const hasAsyncScripts = content.includes('async') || content.includes('defer')
  const hasPreloadLinks = content.includes('rel="preload"')
  const hasMetaDescription = content.includes('name="description"')
  const hasMetaKeywords = content.includes('name="keywords"')
  
  // Security Analysis
  const hasCSRFProtection = content.includes('csrf') || content.includes('_token')
  const hasContentSecurityPolicy = content.includes('Content-Security-Policy')
  const hasXFrameOptions = content.includes('X-Frame-Options')
  
  // Calculate comprehensive quality metrics
  const calculateQualityScore = (): QualityMetric[] => {
    return [
      {
        name: 'Accessibility',
        value: Math.round(((
          (hasAltText ? 1 : 0) +
          (hasLabels ? 1 : 0) +
          (hasAriaLabels ? 1 : 0) +
          (hasTitleAttributes ? 1 : 0) +
          (hasLangAttribute ? 1 : 0) +
          (hasProperHeadingStructure ? 1 : 0)
        ) / 6) * 100),
        max: 100,
        status: hasAltText && hasLabels && hasLangAttribute ? 'excellent' : 
                hasAltText && hasLabels ? 'good' : 
                hasAltText || hasLabels ? 'warning' : 'critical',
        description: 'Measures accessibility compliance and user experience'
      },
      {
        name: 'Structure',
        value: Math.round(((
          (hasSemanticHTML ? 1 : 0) +
          (hasProperHeadingStructure ? 1 : 0) +
          (hasViewport ? 1 : 0) +
          (hasResponsiveDesign ? 1 : 0) +
          (!hasDeprecatedTags ? 1 : 0)
        ) / 5) * 100),
        max: 100,
        status: hasSemanticHTML && hasProperHeadingStructure && hasViewport ? 'excellent' :
                hasSemanticHTML && hasViewport ? 'good' :
                hasViewport ? 'warning' : 'critical',
        description: 'Evaluates HTML structure and semantic markup'
      },
      {
        name: 'Performance',
        value: Math.round(((
          (hasExternalCSS ? 1 : 0) +
          (hasExternalJS ? 1 : 0) +
          (hasLazyLoading ? 1 : 0) +
          (hasAsyncScripts ? 1 : 0) +
          (!hasInlineStyles ? 1 : 0) +
          (!hasInlineScripts ? 1 : 0)
        ) / 6) * 100),
        max: 100,
        status: hasExternalCSS && hasExternalJS && hasLazyLoading ? 'excellent' :
                hasExternalCSS && hasExternalJS ? 'good' :
                hasExternalCSS || hasExternalJS ? 'warning' : 'critical',
        description: 'Assesses code organization and loading optimization'
      },
      {
        name: 'Modern Standards',
        value: Math.round(((
          (hasViewport ? 1 : 0) +
          (hasResponsiveDesign ? 1 : 0) +
          (hasMetaDescription ? 1 : 0) +
          (!hasDeprecatedTags ? 1 : 0) +
          (hasSemanticHTML ? 1 : 0)
        ) / 5) * 100),
        max: 100,
        status: hasViewport && hasResponsiveDesign && hasMetaDescription ? 'excellent' :
                hasViewport && hasResponsiveDesign ? 'good' :
                hasViewport ? 'warning' : 'critical',
        description: 'Checks adherence to modern web development standards'
      }
    ]
  }
  
  const qualityMetrics = calculateQualityScore()
  const overallScore = Math.round(qualityMetrics.reduce((sum, metric) => sum + metric.value, 0) / qualityMetrics.length)
  
  // Generate comprehensive recommendations
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = []
    
    if (!hasViewport) {
      recommendations.push({
        id: 'viewport-meta',
        title: 'Add Viewport Meta Tag',
        description: 'Include a viewport meta tag to ensure proper mobile responsiveness and prevent horizontal scrolling.',
        priority: 'high',
        category: 'modern-standards',
        impact: 'Critical for mobile user experience'
      })
    }
    
    if (!hasAltText && imageCount > 0) {
      recommendations.push({
        id: 'alt-text',
        title: 'Add Alt Text to Images',
        description: `Add descriptive alt text to all ${imageCount} images for better accessibility and SEO.`,
        priority: 'high',
        category: 'accessibility',
        impact: 'Essential for screen readers and search engines'
      })
    }
    
    if (hasForms && !hasLabels) {
      recommendations.push({
        id: 'form-labels',
        title: 'Add Form Labels',
        description: 'Associate labels with form inputs for better accessibility and user experience.',
        priority: 'high',
        category: 'accessibility',
        impact: 'Required for WCAG compliance'
      })
    }
    
    if (hasInlineStyles) {
      recommendations.push({
        id: 'inline-styles',
        title: 'Move Inline Styles to CSS',
        description: 'Extract inline styles to external CSS files for better maintainability and performance.',
        priority: 'medium',
        category: 'performance',
        impact: 'Improves code organization and caching'
      })
    }
    
    if (hasDeprecatedTags) {
      recommendations.push({
        id: 'deprecated-tags',
        title: 'Remove Deprecated HTML Tags',
        description: 'Replace deprecated tags with modern HTML5 alternatives for better compatibility.',
        priority: 'high',
        category: 'modern-standards',
        impact: 'Ensures cross-browser compatibility'
      })
    }
    
    if (!hasSemanticHTML) {
      recommendations.push({
        id: 'semantic-html',
        title: 'Use Semantic HTML Elements',
        description: 'Replace div containers with semantic elements like header, nav, main, section, article, and footer.',
        priority: 'medium',
        category: 'structure',
        impact: 'Improves SEO and accessibility'
      })
    }
    
    if (!hasResponsiveDesign) {
      recommendations.push({
        id: 'responsive-design',
        title: 'Implement Responsive Design',
        description: 'Add CSS media queries to ensure the site works well on all device sizes.',
        priority: 'high',
        category: 'modern-standards',
        impact: 'Essential for mobile-first web design'
      })
    }
    
    if (!hasLazyLoading && imageCount > 3) {
      recommendations.push({
        id: 'lazy-loading',
        title: 'Implement Lazy Loading',
        description: 'Add lazy loading to images to improve page load performance.',
        priority: 'medium',
        category: 'performance',
        impact: 'Reduces initial page load time'
      })
    }
    
    if (!hasMetaDescription) {
      recommendations.push({
        id: 'meta-description',
        title: 'Add Meta Description',
        description: 'Include a meta description tag for better SEO and social media sharing.',
        priority: 'medium',
        category: 'modern-standards',
        impact: 'Improves search engine visibility'
      })
    }
    
    return recommendations
  }
  
  const recommendations = generateRecommendations()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'good': return 'bg-blue-100 text-blue-900 border-blue-300'
      case 'warning': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'critical': return 'bg-gray-200 text-gray-900 border-gray-400'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gray-200 text-gray-900'
      case 'medium': return 'bg-gray-100 text-gray-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      {/* Overall Quality Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">UI Quality Analysis</h2>
            <p className="text-gray-600">Comprehensive assessment of your page's user interface and structure</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-blue-600">{overallScore}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-xs text-gray-500">Out of 100</div>
          </div>
        </div>
        
        {/* Quality Metrics Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {qualityMetrics.map((metric, index) => (
            <div key={index} className={`rounded-lg border p-4 ${getStatusColor(metric.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{metric.name}</h4>
                <span className="text-xs font-medium">{metric.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metric.status === 'excellent' ? 'bg-blue-500' :
                    metric.status === 'good' ? 'bg-blue-400' :
                    metric.status === 'warning' ? 'bg-gray-400' : 'bg-gray-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
            </div>
          ))}
        </div> */}
      </div>

      {/* Page Structure Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Page Structure Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{headingCount}</div>
            <div className="text-sm text-gray-600">Headings</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{imageCount}</div>
            <div className="text-sm text-gray-600">Images</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{linkCount}</div>
            <div className="text-sm text-gray-600">Links</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formCount}</div>
            <div className="text-sm text-gray-600">Forms</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{buttonCount}</div>
            <div className="text-sm text-gray-600">Buttons</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inputCount}</div>
            <div className="text-sm text-gray-600">Inputs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{labelCount}</div>
            <div className="text-sm text-gray-600">Labels</div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accessibility Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Accessibility Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Alt Text for Images</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasAltText ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-900'
              }`}>
                {hasAltText ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Form Labels</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasLabels ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-900'
              }`}>
                {hasLabels ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">ARIA Labels</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasAriaLabels ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasAriaLabels ? 'Present' : 'Not Found'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Language Attribute</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasLangAttribute ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-900'
              }`}>
                {hasLangAttribute ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Title Attributes</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasTitleAttributes ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasTitleAttributes ? 'Present' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Code Quality Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Code Quality Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">External CSS</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasExternalCSS ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasExternalCSS ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">External JavaScript</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasExternalJS ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasExternalJS ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Inline Styles</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasInlineStyles ? 'bg-gray-200 text-gray-900' : 'bg-blue-100 text-blue-800'
              }`}>
                {hasInlineStyles ? 'Found' : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Deprecated Tags</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasDeprecatedTags ? 'bg-gray-200 text-gray-900' : 'bg-blue-100 text-blue-800'
              }`}>
                {hasDeprecatedTags ? 'Found' : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Semantic HTML</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasSemanticHTML ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasSemanticHTML ? 'Present' : 'Not Found'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Modern Standards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Indicators */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Performance Indicators
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Lazy Loading</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasLazyLoading ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasLazyLoading ? 'Enabled' : 'Not Enabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Async Scripts</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasAsyncScripts ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasAsyncScripts ? 'Present' : 'Not Found'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Preload Links</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasPreloadLinks ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasPreloadLinks ? 'Present' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Modern Standards */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Modern Standards
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Viewport Meta Tag</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasViewport ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-900'
              }`}>
                {hasViewport ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Responsive Design</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasResponsiveDesign ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasResponsiveDesign ? 'Detected' : 'Not Detected'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Meta Description</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasMetaDescription ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasMetaDescription ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Improvement Recommendations</h3>
        {recommendations.length === 0 ? (
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-blue-600 text-4xl mb-2">🎉</div>
            <h4 className="font-semibold text-blue-900 mb-1">Excellent Work!</h4>
            <p className="text-blue-800">Your page follows modern web standards and best practices.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={rec.id} className={`rounded-lg border-l-4 p-4 ${
                rec.priority === 'high' ? 'border-gray-400 bg-gray-50' :
                rec.priority === 'medium' ? 'border-gray-300 bg-gray-25' :
                'border-blue-300 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-semibold text-gray-900 mr-3">{rec.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{rec.description}</p>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Impact:</span>
                      <span className="ml-1">{rec.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
