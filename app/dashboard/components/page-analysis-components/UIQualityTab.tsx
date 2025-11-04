'use client'

import { useState, useEffect } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface UIQualityTabProps {
  page: {
    id?: string
    html_content: string | null
    url?: string
    page_image?: {
      url?: string
      imageUrl?: string
      screenshotUrl?: string
    } | null
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

interface ImageAnalysis {
  ui_ux_score: number
  content_score: number
  overall_score: number
  ui_ux_analysis: {
    layout_score: number
    color_scheme_score: number
    typography_score: number
    spacing_score: number
    visual_hierarchy_score: number
    accessibility_score?: number
    mobile_responsiveness_score?: number
    navigation_score?: number
    call_to_action_score?: number
    issues: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      description: string
      suggestion: string
      location?: string
      impact?: string
    }>
    strengths: string[]
    detailed_metrics?: {
      color_contrast_ratio?: string
      font_sizes_used?: string[]
      spacing_consistency?: string
      element_alignment?: string
      visual_balance?: string
    }
  }
  content_analysis: {
    readability_score: number
    clarity_score: number
    structure_score: number
    seo_score?: number
    content_length_score?: number
    heading_structure_score?: number
    issues: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      description: string
      suggestion: string
      location?: string
    }>
    strengths: string[]
    detailed_metrics?: {
      word_count_estimate?: number
      heading_count?: number
      paragraph_count?: number
      list_usage?: string
      content_density?: string
    }
  }
  design_patterns?: {
    identified_patterns?: string[]
    modern_design_elements?: string[]
    outdated_elements?: string[]
    best_practices_followed?: string[]
    best_practices_missing?: string[]
  }
  brand_consistency?: {
    score?: number
    color_consistency?: string
    typography_consistency?: string
    style_consistency?: string
    issues?: Array<{
      description: string
      suggestion: string
    }>
  }
  recommendations: Array<{
    category?: string
    priority?: 'high' | 'medium' | 'low'
    title?: string
    description?: string
    impact?: string
    effort?: 'low' | 'medium' | 'high'
  }> | string[]
  summary: string
  detailed_summary?: {
    overall_assessment?: string
    key_strengths?: string[]
    key_weaknesses?: string[]
    quick_wins?: string[]
    long_term_improvements?: string[]
  }
  analysis_timestamp: string
}

export default function UIQualityTab({ page }: UIQualityTabProps) {
  const content = page.html_content || ''
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [hasCheckedDatabase, setHasCheckedDatabase] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [currentStep, setCurrentStep] = useState<'idle' | 'capturing' | 'analyzing' | 'complete'>('idle')

  // Unified process: Capture screenshot and analyze in one flow
  const processPageAnalysis = async (forceRetake: boolean = false) => {
    if (!page.url || !page.id) {
      setProcessingError('No URL or page ID available')
        return
      }

    setProcessing(true)
    setProcessingError(null)
    setCurrentStep('capturing')
    setImageAnalysis(null)

    try {
      // Step 1: Capture screenshot
      setCurrentStep('capturing')
      const screenshotResponse = await fetch('/api/screenshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: page.url,
          pageId: page.id,
            options: {
              delay: 3000
            },
            priority: 1
          })
        })

      if (!screenshotResponse.ok) {
        const errorData = await screenshotResponse.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `Failed to capture screenshot: ${screenshotResponse.statusText}`)
      }

      const screenshotData = await screenshotResponse.json()
      const imageUrl = screenshotData.url || screenshotData.data?.url || screenshotData.data?.imageUrl || screenshotData.data?.screenshotUrl
      
      if (!imageUrl) {
          throw new Error('Invalid response format: no image URL found')
        }

      setScreenshotUrl(imageUrl)

      // Step 2: Analyze image immediately (no delay)
      setCurrentStep('analyzing')
      const analysisResponse = await fetch('/api/image-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: page.id,
          imageUrl,
          pageUrl: page.url,
          userId: null
        })
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}))
        // Don't throw error if analysis fails, just show the screenshot
        console.error('Analysis error:', errorData)
        setProcessingError(errorData.details || errorData.error || 'Analysis failed, but screenshot captured')
        setCurrentStep('complete')
        return
      }

      const analysisData = await analysisResponse.json()
      if (analysisData.analysis) {
        setImageAnalysis(analysisData.analysis)
      }
      
      setCurrentStep('complete')
      } catch (error) {
      console.error('Error processing page analysis:', error)
      setProcessingError(error instanceof Error ? error.message : 'Failed to process page analysis')
      setCurrentStep('complete')
      } finally {
      setProcessing(false)
    }
  }

  const handleRetakeScreenshot = () => {
    processPageAnalysis(true)
  }

  // Check if image exists in database first - only run when page.id changes
  useEffect(() => {
    // Reset check state when page changes
    setHasCheckedDatabase(false)
    setProcessingError(null)
    setCurrentStep('idle')

    // Check database first - look for valid image URL and analysis
    const existingImageUrl = page.page_image?.url || page.page_image?.imageUrl || page.page_image?.screenshotUrl
    
    if (existingImageUrl && typeof existingImageUrl === 'string' && existingImageUrl.trim() !== '') {
      // Image exists in database, use it
      setScreenshotUrl(existingImageUrl)
      setHasCheckedDatabase(true)
      
      // Check if analysis also exists - if so, fetch it; otherwise trigger new analysis
      if (page.id && page.url) {
        // Try to get existing analysis first
        fetch(`/api/image-analysis?pageId=${page.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.analysis) {
              setImageAnalysis(data.analysis)
              setCurrentStep('complete')
            } else {
              // No analysis exists, trigger it
              processPageAnalysis(false)
            }
          })
          .catch(() => {
            // If check fails, trigger new analysis
            processPageAnalysis(false)
          })
      }
      return
    }

    // No valid image in database - check if we can fetch one
    if (!page.url || !page.id) {
      if (!page.url) {
        setProcessingError('No URL available')
      }
      setHasCheckedDatabase(true)
      return
    }

    // No image in database, start the full process
    setHasCheckedDatabase(true)
    processPageAnalysis(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]) // Only depend on page.id to avoid re-running unnecessarily
  
  // Comprehensive HTML Structure Analysis
  const hasViewport = content.includes('viewport')
  const hasResponsiveDesign = content.includes('responsive') || content.includes('mobile') || content.includes('@media')
  const hasForms = content.includes('<form')
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
  
  
  // Accessibility Analysis
  const hasAltText = content.includes('alt=')
  const hasTitleAttributes = content.includes('title=')
  const hasAriaLabels = content.includes('aria-label') || content.includes('aria-labelledby')
  
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
  
  
  // Security Analysis
  
  
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
      {/* Header with Reanalyze Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">UI Quality Analysis</h2>
        {(imageAnalysis || screenshotUrl) && (
          <button
            onClick={handleRetakeScreenshot}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
            <span>{processing ? 'Reanalyzing...' : 'Reanalyze'}</span>
          </button>
        )}
      </div>

      {/* Overall Quality Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-gray-600">Comprehensive assessment of your page&apos;s user interface and structure</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-blue-600">{overallScore}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-xs text-gray-500">Out of 100</div>
          </div>
        </div>
        
        {/* Processing Steps - Professional Loader */}
        {processing && (
          <div className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 p-8 shadow-lg">
            <div className="max-w-lg mx-auto">
              {/* Animated Header */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Analyzing Your Page
                </h3>
                <p className="text-sm text-gray-600 mt-1">Please wait while we process your page...</p>
          </div>
              
              <div className="space-y-5">
                {/* Step 1: Capturing */}
                <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-500 ${
                  currentStep === 'capturing' ? 'border-blue-500 bg-white shadow-lg scale-105' :
                  currentStep === 'analyzing' || currentStep === 'complete' ? 'border-green-400 bg-green-50 shadow-md' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  {/* Progress bar for active step */}
                  {currentStep === 'capturing' && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                  )}
                  
                  <div className="p-5 flex items-center space-x-4">
                    <div className={`relative flex-shrink-0 ${
                      currentStep === 'capturing' ? 'animate-bounce' : ''
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep === 'capturing' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg ring-4 ring-blue-200' :
                        currentStep === 'analyzing' || currentStep === 'complete' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {currentStep === 'capturing' ? (
                          <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : currentStep === 'analyzing' || currentStep === 'complete' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                      {currentStep === 'capturing' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-base font-semibold transition-colors ${
                        currentStep === 'capturing' ? 'text-blue-700' : 
                        currentStep === 'analyzing' || currentStep === 'complete' ? 'text-green-700' : 
                        'text-gray-500'
                      }`}>
                        {currentStep === 'capturing' && '📸 '}Capturing page screenshot
                        {currentStep === 'analyzing' || currentStep === 'complete' ? ' ✓' : currentStep === 'capturing' ? '...' : ''}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Taking a high-quality snapshot of your page</div>
                      {currentStep === 'capturing' && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: Analyzing */}
                <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-500 ${
                  currentStep === 'analyzing' ? 'border-purple-500 bg-white shadow-lg scale-105' :
                  currentStep === 'complete' ? 'border-green-400 bg-green-50 shadow-md' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  {/* Progress bar for active step */}
                  {currentStep === 'analyzing' && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                  )}
                  
                  <div className="p-5 flex items-center space-x-4">
                    <div className={`relative flex-shrink-0 ${
                      currentStep === 'analyzing' ? 'animate-pulse' : ''
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep === 'analyzing' ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg ring-4 ring-purple-200' :
                        currentStep === 'complete' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {currentStep === 'analyzing' ? (
                          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        ) : currentStep === 'complete' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                      {currentStep === 'analyzing' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full border-2 border-white animate-ping"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-base font-semibold transition-colors ${
                        currentStep === 'analyzing' ? 'text-purple-700' : 
                        currentStep === 'complete' ? 'text-green-700' : 
                        'text-gray-500'
                      }`}>
                        {currentStep === 'analyzing' && '🤖 '}AI analyzing your page
                        {currentStep === 'complete' ? ' ✓' : currentStep === 'analyzing' ? '...' : ''}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Evaluating UI/UX design, content quality, and grammar</div>
                      {currentStep === 'analyzing' && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '85%' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated dots indicator */}
              <div className="flex justify-center space-x-2 mt-6">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'capturing' ? 'bg-blue-500 scale-125 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'analyzing' ? 'bg-purple-500 scale-125 animate-pulse' : 
                  currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'complete' ? 'bg-green-500 scale-125' : 'bg-gray-300'
                }`}></div>
              </div>
            </div>
          </div>
        )}

        {processingError && (
          <div className="mt-6 bg-white rounded-lg border border-red-200 p-6">
            <div className="text-red-600 text-sm mb-2">Error processing page</div>
            <div className="text-red-500 text-xs">{processingError}</div>
          </div>
        )}

        {imageAnalysis && (
          <div className="mt-6 space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">AI-Powered Page Analysis</h3>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">{imageAnalysis.overall_score}</div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{imageAnalysis.summary}</p>
              
              {/* Score Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">UI/UX Score</div>
                  <div className="text-2xl font-bold text-gray-900">{imageAnalysis.ui_ux_score}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Content Score</div>
                  <div className="text-2xl font-bold text-gray-900">{imageAnalysis.content_score}</div>
                </div>
              </div>
            </div>

            {/* UI/UX Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">UI/UX Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.layout_score}</div>
                  <div className="text-xs text-gray-600">Layout</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.color_scheme_score}</div>
                  <div className="text-xs text-gray-600">Colors</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.typography_score}</div>
                  <div className="text-xs text-gray-600">Typography</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.spacing_score}</div>
                  <div className="text-xs text-gray-600">Spacing</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.visual_hierarchy_score}</div>
                  <div className="text-xs text-gray-600">Hierarchy</div>
                </div>
                {imageAnalysis.ui_ux_analysis.accessibility_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.accessibility_score}</div>
                    <div className="text-xs text-gray-600">Accessibility</div>
                  </div>
                )}
                {imageAnalysis.ui_ux_analysis.mobile_responsiveness_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.mobile_responsiveness_score}</div>
                    <div className="text-xs text-gray-600">Mobile</div>
                  </div>
                )}
                {imageAnalysis.ui_ux_analysis.navigation_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.navigation_score}</div>
                    <div className="text-xs text-gray-600">Navigation</div>
                  </div>
                )}
                {imageAnalysis.ui_ux_analysis.call_to_action_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.ui_ux_analysis.call_to_action_score}</div>
                    <div className="text-xs text-gray-600">CTA</div>
                  </div>
                )}
              </div>

              {/* Detailed Metrics */}
              {imageAnalysis.ui_ux_analysis.detailed_metrics && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-3">Detailed Metrics</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {imageAnalysis.ui_ux_analysis.detailed_metrics.color_contrast_ratio && (
                <div>
                        <span className="font-medium text-gray-700">Color Contrast:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.ui_ux_analysis.detailed_metrics.color_contrast_ratio}</span>
                      </div>
                    )}
                    {imageAnalysis.ui_ux_analysis.detailed_metrics.font_sizes_used && imageAnalysis.ui_ux_analysis.detailed_metrics.font_sizes_used.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Font Sizes:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.ui_ux_analysis.detailed_metrics.font_sizes_used.join(', ')}</span>
                      </div>
                    )}
                    {imageAnalysis.ui_ux_analysis.detailed_metrics.spacing_consistency && (
                      <div>
                        <span className="font-medium text-gray-700">Spacing:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.ui_ux_analysis.detailed_metrics.spacing_consistency}</span>
                      </div>
                    )}
                    {imageAnalysis.ui_ux_analysis.detailed_metrics.element_alignment && (
                      <div>
                        <span className="font-medium text-gray-700">Alignment:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.ui_ux_analysis.detailed_metrics.element_alignment}</span>
                      </div>
                    )}
                    {imageAnalysis.ui_ux_analysis.detailed_metrics.visual_balance && (
                      <div>
                        <span className="font-medium text-gray-700">Visual Balance:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.ui_ux_analysis.detailed_metrics.visual_balance}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {imageAnalysis.ui_ux_analysis.strengths.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Strengths:</div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {imageAnalysis.ui_ux_analysis.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                    </ul>
                </div>
              )}

              {imageAnalysis.ui_ux_analysis.issues.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Issues:</div>
                  <div className="space-y-2">
                    {imageAnalysis.ui_ux_analysis.issues.map((issue, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                        issue.severity === 'high' ? 'border-red-400 bg-red-50' :
                        issue.severity === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                        'border-blue-400 bg-blue-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{issue.description}</div>
                            <div className="text-xs text-gray-600 mt-1">{issue.suggestion}</div>
                            {issue.location && (
                              <div className="text-xs text-gray-500 mt-1">Location: {issue.location}</div>
                            )}
                            {issue.impact && (
                              <div className="text-xs text-gray-500 mt-1">Impact: {issue.impact}</div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
            </div>
          </div>
        )}
            </div>

            {/* Content Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Content Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.content_analysis.readability_score}</div>
                  <div className="text-xs text-gray-600">Readability</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.content_analysis.clarity_score}</div>
                  <div className="text-xs text-gray-600">Clarity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{imageAnalysis.content_analysis.structure_score}</div>
                  <div className="text-xs text-gray-600">Structure</div>
                </div>
                {imageAnalysis.content_analysis.seo_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.content_analysis.seo_score}</div>
                    <div className="text-xs text-gray-600">SEO</div>
                  </div>
                )}
                {imageAnalysis.content_analysis.content_length_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.content_analysis.content_length_score}</div>
                    <div className="text-xs text-gray-600">Length</div>
                  </div>
                )}
                {imageAnalysis.content_analysis.heading_structure_score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{imageAnalysis.content_analysis.heading_structure_score}</div>
                    <div className="text-xs text-gray-600">Headings</div>
                  </div>
                )}
              </div>

              {/* Content Detailed Metrics */}
              {imageAnalysis.content_analysis.detailed_metrics && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-3">Content Metrics</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {imageAnalysis.content_analysis.detailed_metrics.word_count_estimate !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Words:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.content_analysis.detailed_metrics.word_count_estimate.toLocaleString()}</span>
                      </div>
                    )}
                    {imageAnalysis.content_analysis.detailed_metrics.heading_count !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Headings:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.content_analysis.detailed_metrics.heading_count}</span>
                      </div>
                    )}
                    {imageAnalysis.content_analysis.detailed_metrics.paragraph_count !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Paragraphs:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.content_analysis.detailed_metrics.paragraph_count}</span>
                      </div>
                    )}
                    {imageAnalysis.content_analysis.detailed_metrics.list_usage && (
                      <div>
                        <span className="font-medium text-gray-700">Lists:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.content_analysis.detailed_metrics.list_usage}</span>
                      </div>
                    )}
                    {imageAnalysis.content_analysis.detailed_metrics.content_density && (
                      <div>
                        <span className="font-medium text-gray-700">Density:</span>
                        <span className="ml-2 text-gray-600">{imageAnalysis.content_analysis.detailed_metrics.content_density}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {imageAnalysis.content_analysis.strengths.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Strengths:</div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {imageAnalysis.content_analysis.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {imageAnalysis.content_analysis.issues.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Issues:</div>
                  <div className="space-y-2">
                    {imageAnalysis.content_analysis.issues.map((issue, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                        issue.severity === 'high' ? 'border-red-400 bg-red-50' :
                        issue.severity === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                        'border-blue-400 bg-blue-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{issue.description}</div>
                            <div className="text-xs text-gray-600 mt-1">{issue.suggestion}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Design Patterns */}
            {imageAnalysis.design_patterns && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Design Patterns & Best Practices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {imageAnalysis.design_patterns.identified_patterns && imageAnalysis.design_patterns.identified_patterns.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Identified Patterns:</div>
                      <div className="flex flex-wrap gap-2">
                        {imageAnalysis.design_patterns.identified_patterns.map((pattern, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{pattern}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {imageAnalysis.design_patterns.modern_design_elements && imageAnalysis.design_patterns.modern_design_elements.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-2">Modern Elements:</div>
                      <div className="flex flex-wrap gap-2">
                        {imageAnalysis.design_patterns.modern_design_elements.map((element, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">{element}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {imageAnalysis.design_patterns.outdated_elements && imageAnalysis.design_patterns.outdated_elements.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-700 mb-2">Outdated Elements:</div>
                      <div className="flex flex-wrap gap-2">
                        {imageAnalysis.design_patterns.outdated_elements.map((element, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">{element}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {imageAnalysis.design_patterns.best_practices_followed && imageAnalysis.design_patterns.best_practices_followed.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Best Practices Followed:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {imageAnalysis.design_patterns.best_practices_followed.map((practice, idx) => (
                          <li key={idx}>{practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {imageAnalysis.design_patterns.best_practices_missing && imageAnalysis.design_patterns.best_practices_missing.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-orange-700 mb-2">Missing Best Practices:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {imageAnalysis.design_patterns.best_practices_missing.map((practice, idx) => (
                          <li key={idx}>{practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Brand Consistency */}
            {imageAnalysis.brand_consistency && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Brand Consistency</h4>
                {imageAnalysis.brand_consistency.score !== undefined && (
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900">{imageAnalysis.brand_consistency.score}</div>
                    <div className="text-sm text-gray-600">Consistency Score</div>
                  </div>
                )}
                <div className="space-y-3 mb-4">
                  {imageAnalysis.brand_consistency.color_consistency && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Color Consistency:</div>
                      <div className="text-sm text-gray-600">{imageAnalysis.brand_consistency.color_consistency}</div>
                    </div>
                  )}
                  {imageAnalysis.brand_consistency.typography_consistency && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Typography Consistency:</div>
                      <div className="text-sm text-gray-600">{imageAnalysis.brand_consistency.typography_consistency}</div>
                    </div>
                  )}
                  {imageAnalysis.brand_consistency.style_consistency && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Style Consistency:</div>
                      <div className="text-sm text-gray-600">{imageAnalysis.brand_consistency.style_consistency}</div>
                    </div>
                  )}
                </div>
                {imageAnalysis.brand_consistency.issues && imageAnalysis.brand_consistency.issues.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Consistency Issues:</div>
                    <div className="space-y-2">
                      {imageAnalysis.brand_consistency.issues.map((issue, idx) => (
                        <div key={idx} className="p-3 rounded-lg border-l-4 border-orange-400 bg-orange-50">
                          <div className="text-sm font-medium text-gray-900">{issue.description}</div>
                          <div className="text-xs text-gray-600 mt-1">{issue.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Summary */}
            {imageAnalysis.detailed_summary && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Assessment</h4>
                {imageAnalysis.detailed_summary.overall_assessment && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Overall Assessment:</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{imageAnalysis.detailed_summary.overall_assessment}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {imageAnalysis.detailed_summary.key_strengths && imageAnalysis.detailed_summary.key_strengths.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-2">Key Strengths:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {imageAnalysis.detailed_summary.key_strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {imageAnalysis.detailed_summary.key_weaknesses && imageAnalysis.detailed_summary.key_weaknesses.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-700 mb-2">Key Weaknesses:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {imageAnalysis.detailed_summary.key_weaknesses.map((weakness, idx) => (
                          <li key={idx}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {imageAnalysis.detailed_summary.quick_wins && imageAnalysis.detailed_summary.quick_wins.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-blue-700 mb-2">Quick Wins:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {imageAnalysis.detailed_summary.quick_wins.map((win, idx) => (
                          <li key={idx}>{win}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {imageAnalysis.detailed_summary.long_term_improvements && imageAnalysis.detailed_summary.long_term_improvements.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-purple-700 mb-2">Long-term Improvements:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {imageAnalysis.detailed_summary.long_term_improvements.map((improvement, idx) => (
                          <li key={idx}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {imageAnalysis.recommendations && imageAnalysis.recommendations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Actionable Recommendations</h4>
                <div className="space-y-4">
                  {imageAnalysis.recommendations.map((rec, idx) => {
                    // Handle both old format (string) and new format (object)
                    if (typeof rec === 'string') {
                      return (
                        <div key={idx} className="p-3 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                          <div className="text-sm text-gray-700">{rec}</div>
                        </div>
                      )
                    }
                    return (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                        rec.priority === 'high' ? 'border-red-400 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                        'border-blue-400 bg-blue-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {rec.category && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">{rec.category}</span>
                              )}
                              {rec.effort && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Effort: {rec.effort}</span>
                              )}
                            </div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-1">{rec.title || rec.description}</h5>
                            {rec.description && rec.title && (
                              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                            )}
                            {rec.impact && (
                              <p className="text-xs text-gray-600">Impact: {rec.impact}</p>
                            )}
                          </div>
                          {rec.priority && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screenshot in Small Box - Only show after analysis is complete */}
        {screenshotUrl && !processing && currentStep === 'complete' && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Page Screenshot</h3>
              {page.id && (
                <button
                  onClick={handleRetakeScreenshot}
                  disabled={processing}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="w-3 h-3" />
                  <span>Retake</span>
                </button>
              )}
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 max-w-xs">
              <img 
                src={screenshotUrl} 
                alt="Page screenshot" 
                className="w-full h-auto max-h-48 object-contain"
                onError={() => setProcessingError('Failed to load image')}
              />
            </div>
          </div>
        )}
        
        {/* Quality Metrics Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {qualityMetrics.map((metric) => (
            <div key={metric.name} className={`rounded-lg border p-4`}>
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
            {recommendations.map((rec) => (
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
