'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useUserPlan } from '@/hooks/useUserPlan'
import { useScreenshot } from '@/lib/api-client'

interface UIQualityTabProps {
  page: {
    id?: string
    html_content: string | null
    url?: string
    page_image?: {
      url?: string
      imageUrl?: string
      screenshotUrl?: string
      desktop?: {
        url?: string
        imageUrl?: string
        screenshotUrl?: string
        [key: string]: any
      }
      mobile?: {
        url?: string
        imageUrl?: string
        screenshotUrl?: string
        [key: string]: any
      } | null
      [key: string]: any
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
  desktop?: {
    ui_ux_score: number
    content_score: number
    overall_score: number
    [key: string]: any
  }
  mobile?: {
    ui_ux_score: number
    content_score: number
    overall_score: number
    [key: string]: any
  } | null
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
  const { hasFeature, loading: planLoading, planInfo } = useUserPlan()
  const hasScreenshotAccess = hasFeature('capture_screenshot')
  
  // Log plan features for debugging
  useEffect(() => {
    if (!planLoading && planInfo) {
      console.log('UIQualityTab - Plan Features*****************************************************:', {
        planType: planInfo.plan_type,
        planName: planInfo.plan_name,
        can_use_features: planInfo.can_use_features,
        hasScreenshotAccess,
        featuresCount: planInfo.can_use_features?.length || 0
      })
    }
  }, [planLoading, planInfo, hasScreenshotAccess])
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [desktopScreenshotUrl, setDesktopScreenshotUrl] = useState<string | null>(null)
  const [mobileScreenshotUrl, setMobileScreenshotUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [hasCheckedDatabase, setHasCheckedDatabase] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [currentStep, setCurrentStep] = useState<'idle' | 'capturing' | 'analyzing' | 'complete'>('idle')

  // Use the screenshot API client hook
  const {
    takeScreenshot: apiTakeScreenshot,
    isProcessing: apiIsProcessing,
    error: apiError,
    clearError: clearApiError,
  } = useScreenshot({
    onError: (error) => {
      console.error('Screenshot API error:', error)
      setProcessingError(error.message || 'Failed to capture screenshot')
    },
  })

  // Refs to prevent duplicate API calls and handle cleanup
  const isProcessingRef = useRef(false)
  const currentPageIdRef = useRef<string | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasInitializedRef = useRef<string | undefined>(undefined) // Track which pages have been initialized
  const processingCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper to persist processing state in sessionStorage
  const setProcessingState = (pageId: string | undefined, isProcessing: boolean) => {
    if (typeof window === 'undefined') return
    if (isProcessing && pageId) {
      sessionStorage.setItem(`ui-quality-processing-${pageId}`, 'true')
      sessionStorage.setItem(`ui-quality-processing-page-id`, pageId)
    } else {
      if (pageId) {
        sessionStorage.removeItem(`ui-quality-processing-${pageId}`)
      }
      sessionStorage.removeItem('ui-quality-processing-page-id')
    }
  }

  // Helper to check if processing state exists in sessionStorage
  const getProcessingState = (pageId: string): boolean => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(`ui-quality-processing-${pageId}`) === 'true'
  }

  // Unified process: Capture screenshot and analyze in one flow
  const processPageAnalysis = async (forceRetake: boolean = false) => {
    // Check if user has access to screenshot feature
    if (!hasScreenshotAccess) {
      setProcessingError('Screenshot capture is a premium feature. Please upgrade your plan to access this feature.')
      return
    }

    if (!page.url || !page.id) {
      setProcessingError('No URL or page ID available')
        return
      }

    // Prevent duplicate calls - if already processing the same page, skip
    if (isProcessingRef.current && !forceRetake) {
      if (currentPageIdRef.current === page.id) {
        console.log('Already processing this page, skipping duplicate call')
        return
      }
    }

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Mark as processing and update page ID
    isProcessingRef.current = true
    currentPageIdRef.current = page.id
    hasInitializedRef.current = page.id // Mark as initialized to prevent re-triggering
    
    // Persist processing state to survive tab switches
    setProcessingState(page.id, true)

    setProcessing(true)
    setProcessingError(null)
    clearApiError() // Clear any previous API errors
    setCurrentStep('capturing')
    setImageAnalysis(null)

    try {
      // Step 1: Capture screenshot using API client
      setCurrentStep('capturing')
      
      // Use the API client hook to take screenshot
      const screenshotData = await apiTakeScreenshot(
        page.url,
        {
          delay: 3000
        },
        page.id
      )

      // Handle API client errors
      if (!screenshotData) {
        if (apiError) {
          throw new Error(apiError.message || 'Failed to capture screenshot')
        }
        throw new Error('Failed to capture screenshot: No response received')
      }

      // Extract desktop and mobile URLs from response
      const desktopUrl = screenshotData.desktop?.screenshotUrl ||
                        screenshotData.desktop?.url ||
                        screenshotData.desktopUrl || 
                        screenshotData.data?.desktop?.screenshotUrl ||
                        screenshotData.data?.desktop?.url ||
                        screenshotData.screenshots?.desktop?.screenshotUrl ||
                        screenshotData.screenshots?.desktop?.url ||
                        screenshotData.url || 
                        screenshotData.data?.url || 
                        screenshotData.data?.imageUrl || 
                        screenshotData.data?.screenshotUrl
      
      const mobileUrl = screenshotData.mobile?.screenshotUrl ||
                       screenshotData.mobile?.url ||
                       screenshotData.mobileUrl || 
                       screenshotData.data?.mobile?.screenshotUrl ||
                       screenshotData.data?.mobile?.url ||
                       screenshotData.screenshots?.mobile?.screenshotUrl ||
                       screenshotData.screenshots?.mobile?.url
      
      // If desktop URL exists, we can proceed even if there was an error or mobile failed
      if (desktopUrl) {
        // Log warning if mobile failed but desktop succeeded (non-blocking)
        if (!mobileUrl && (screenshotData.success === 'partial' || screenshotData.success === false)) {
          console.warn('⚠️ Mobile screenshot failed, but desktop screenshot succeeded. Proceeding with desktop only.')
          // Show warning message if provided
          if (screenshotData.warning) {
            console.info('ℹ️', screenshotData.warning)
          }
          // Don't set this as a blocking error - just show a warning message
          // The analysis will proceed with desktop only
        }
      } else {
        // Only throw error if desktop URL is missing
        const errorMsg = screenshotData.details || screenshotData.error || screenshotData.message || 'Invalid response format: no desktop image URL found'
        throw new Error(errorMsg)
      }

      // Set both URLs
      setDesktopScreenshotUrl(desktopUrl)
      setMobileScreenshotUrl(mobileUrl || null)
      setScreenshotUrl(desktopUrl) // Keep legacy for backward compatibility

      // Step 2: Analyze both images immediately (no delay)
      // Note: Not using abort signal to allow requests to continue when component unmounts
      setCurrentStep('analyzing')
      const analysisResponse = await fetch('/api/image-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: page.id,
          desktopUrl,
          mobileUrl: mobileUrl || null,
          pageUrl: page.url,
          userId: null
        })
        // Removed signal to allow requests to continue in background
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
        // Handle both new format (with desktop/mobile) and old format
        const analysis = analysisData.analysis
        if (analysis.desktop) {
          // New format: use desktop analysis as primary, but keep both
          setImageAnalysis(analysis)
        } else {
          // Old format: single analysis
          setImageAnalysis(analysis)
        }
      }
      
      setCurrentStep('complete')
      
      // Clear processing state from sessionStorage on success
      setProcessingState(page.id, false)
      } catch (error) {
      // Log and show error
      console.error('Error processing page analysis:', error)
      setProcessingError(error instanceof Error ? error.message : 'Failed to process page analysis')
      setCurrentStep('complete')
      
      // Clear processing state from sessionStorage on error
      setProcessingState(page.id, false)
      } finally {
      // Reset processing state
      setProcessing(false)
      isProcessingRef.current = false
      
      // Clear abort controller if it's the current one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }

  const handleRetakeScreenshot = () => {
    processPageAnalysis(true)
  }

  // Check if image exists in database - only load existing data, don't trigger new analysis
  useEffect(() => {
    // Wait for plan loading to complete
    if (planLoading) return

    // Check sessionStorage for processing state when component mounts/remounts
    if (page.id && hasScreenshotAccess) {
      const wasProcessing = getProcessingState(page.id)
      
      if (wasProcessing) {
        // We were processing this page - restore processing state and start polling
        isProcessingRef.current = true
        currentPageIdRef.current = page.id
        setProcessing(true)
        setCurrentStep('analyzing')
        
        // Immediately check if analysis completed while away
        fetch(`/api/image-analysis?pageId=${page.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.analysis) {
              // Analysis completed while away - update state
              setImageAnalysis(data.analysis)
              setCurrentStep('complete')
              setProcessing(false)
              isProcessingRef.current = false
              hasInitializedRef.current = page.id
              setProcessingState(page.id, false)
            }
            // If no analysis, polling will continue below
          })
          .catch(() => {
            // Silently fail - polling will continue
          })
      }
    }

    // Abort any ongoing requests for previous page (only on page change, not unmount)
    if (abortControllerRef.current && currentPageIdRef.current !== page.id && currentPageIdRef.current !== undefined) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      isProcessingRef.current = false
      setProcessingState(currentPageIdRef.current, false)
    }

    // Reset check state when page changes (only if it's a different page)
    if (currentPageIdRef.current !== page.id) {
      setHasCheckedDatabase(false)
      setProcessingError(null)
      if (!getProcessingState(page.id || '')) {
        setCurrentStep('idle')
      }
      hasInitializedRef.current = undefined // Reset initialization flag for new page
    }

    // Check database first - look for valid image URL and analysis
    // Support both new format (desktop/mobile) and legacy format
    const desktopImageUrl = page.page_image?.desktop?.screenshotUrl ||
                           page.page_image?.desktop?.url || 
                           page.page_image?.url || 
                           page.page_image?.imageUrl || 
                           page.page_image?.screenshotUrl
    const mobileImageUrl = page.page_image?.mobile?.screenshotUrl ||
                          page.page_image?.mobile?.url
    
    if (desktopImageUrl && typeof desktopImageUrl === 'string' && desktopImageUrl.trim() !== '') {
      // Image exists in database, use it (even if user doesn't have access, show existing screenshots)
      setDesktopScreenshotUrl(desktopImageUrl)
      setMobileScreenshotUrl(mobileImageUrl && typeof mobileImageUrl === 'string' ? mobileImageUrl : null)
      setScreenshotUrl(desktopImageUrl) // Keep legacy for backward compatibility
      setHasCheckedDatabase(true)
      
      // Mark as initialized since we found image in database
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = page.id
      }
      
      // Check if analysis also exists - if so, fetch it; otherwise trigger new analysis automatically
      if (page.id && page.url && hasScreenshotAccess) {
        // Only trigger if not already processing this page
        const isProcessingSamePage = isProcessingRef.current && currentPageIdRef.current === page.id
        if (!isProcessingSamePage) {
          // Try to get existing analysis first
          fetch(`/api/image-analysis?pageId=${page.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.analysis) {
                setImageAnalysis(data.analysis)
                setCurrentStep('complete')
                hasInitializedRef.current = page.id // Mark as initialized since we have analysis
              } else {
                // No analysis exists, trigger it automatically
                const stillProcessingSamePage = isProcessingRef.current && currentPageIdRef.current === page.id
                if (!stillProcessingSamePage) {
                  processPageAnalysis(false)
                }
              }
            })
            .catch(() => {
              // If check fails, trigger new analysis automatically
              const stillProcessingSamePage = isProcessingRef.current && currentPageIdRef.current === page.id
              if (!stillProcessingSamePage) {
                processPageAnalysis(false)
              }
            })
        }
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

    // No image in database, start the full process automatically (only if user has access and not already processing)
    setHasCheckedDatabase(true)
    const isProcessingSamePage = isProcessingRef.current && currentPageIdRef.current === page.id
    if (hasScreenshotAccess && !isProcessingSamePage) {
      processPageAnalysis(false)
    }

    // Cleanup function - only abort when page.id changes, not on unmount
    // This allows analysis to continue in background when switching tabs
    return () => {
      // Only abort if page.id changed (handled above in the effect)
      // Don't abort on unmount - let requests complete in background
      // The abort for page changes is already handled above
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, planLoading, hasScreenshotAccess]) // Depend on plan loading and access

  // Poll for completion when processing - checks if analysis completed in background
  // This works even if component was unmounted and remounted
  useEffect(() => {
    // Check both processing state and sessionStorage
    const shouldPoll = (processing || getProcessingState(page.id || '')) && 
                      page.id && 
                      hasScreenshotAccess &&
                      currentPageIdRef.current === page.id

    if (!shouldPoll) {
      // Clear any existing interval
      if (processingCheckIntervalRef.current) {
        clearInterval(processingCheckIntervalRef.current)
        processingCheckIntervalRef.current = null
      }
      return
    }

    // Ensure processing state is set
    if (!processing) {
      setProcessing(true)
    }

    // Poll every 3 seconds to check if analysis completed
    const pollInterval = setInterval(() => {
      // Double-check we should still be polling
      if (!getProcessingState(page.id || '') && !isProcessingRef.current) {
        clearInterval(pollInterval)
        processingCheckIntervalRef.current = null
        return
      }

      if (currentPageIdRef.current !== page.id) {
        clearInterval(pollInterval)
        processingCheckIntervalRef.current = null
        return
      }

      fetch(`/api/image-analysis?pageId=${page.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.analysis) {
            // Analysis completed - update state
            setImageAnalysis(data.analysis)
            setCurrentStep('complete')
            setProcessing(false)
            isProcessingRef.current = false
            hasInitializedRef.current = page.id
            setProcessingState(page.id, false)
            clearInterval(pollInterval)
            processingCheckIntervalRef.current = null
          }
        })
        .catch(() => {
          // Silently fail - keep polling
        })
    }, 3000) // Poll every 3 seconds

    processingCheckIntervalRef.current = pollInterval

    return () => {
      if (processingCheckIntervalRef.current) {
        clearInterval(processingCheckIntervalRef.current)
        processingCheckIntervalRef.current = null
      }
    }
  }, [processing, page.id, hasScreenshotAccess])
  
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

  // Show loading state while checking plan access
  if (planLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // Don't show premium card - show all non-AI data instead
  // Only hide AI-powered screenshot analysis

  return (
    <div className="space-y-8">
      {/* Header with Reanalyze Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">UI Quality Analysis</h2>
        {(imageAnalysis || screenshotUrl || desktopScreenshotUrl) && hasScreenshotAccess && (
          <button
            onClick={handleRetakeScreenshot}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
            <span>{processing ? 'Reanalyzing...' : 'Reanalyze'}</span>
          </button>
        )}
        {!hasScreenshotAccess && (imageAnalysis || screenshotUrl || desktopScreenshotUrl) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Premium Feature - View Only</span>
          </div>
        )}
      </div>

      {/* AI-Powered Screenshot Analysis Section - Premium Feature */}
      {!hasScreenshotAccess && !imageAnalysis && !desktopScreenshotUrl && !screenshotUrl && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">AI-Powered Screenshot Analysis</h3>
              <p className="text-sm text-gray-600 mb-3">
                Capture screenshots and get AI-powered UI/UX analysis of your web pages. This premium feature provides detailed visual design insights, content analysis, and actionable recommendations.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Feature: <span className="font-medium">Capture Screenshot 📸</span>
                </div>
                <button 
                  onClick={() => window.location.href = '/dashboard?tab=profile&subtab=plans'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Quality Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-gray-600">Comprehensive assessment of your page&apos;s user interface and structure</p>
          </div>
          {/* <div className="text-right">
            <div className="text-5xl font-bold text-blue-600">{overallScore}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-xs text-gray-500">Out of 100</div>
          </div> */}
        </div>
        
        {/* Processing Steps - Simple Loader - Only show if user has access */}
        {processing && hasScreenshotAccess && (
          <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Simple spinner */}
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              
              {/* Step indicator */}
              <div className="text-center">
                <div className="text-base font-semibold text-blue-700">
                  {currentStep === 'capturing' && 'Capturing page screenshot...'}
                  {currentStep === 'analyzing' && 'AI analyzing your page...'}
                  {currentStep === 'complete' && 'Analysis complete'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {currentStep === 'capturing' && 'Taking a high-quality snapshot of your page'}
                  {currentStep === 'analyzing' && 'Evaluating UI/UX design and content quality'}
                  {currentStep === 'complete' && 'Results ready'}
                </div>
              </div>

            </div>
          </div>
        )}

        {processingError && hasScreenshotAccess && (
          <div className="mt-6 bg-white rounded-lg border border-red-200 p-6">
            <div className="text-red-600 text-sm mb-2">Error processing page</div>
            <div className="text-red-500 text-xs">{processingError}</div>
          </div>
        )}

        {/* AI Analysis Results - Only show if user has access */}
        {imageAnalysis && hasScreenshotAccess && (() => {
          // Use desktop analysis as primary, fallback to top-level if new format not available
          const primaryAnalysis = imageAnalysis.desktop || imageAnalysis
          return (
          <div className="mt-6 space-y-8">
            {/* Overall Score - Hero Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Page Analysis</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">{primaryAnalysis.summary || imageAnalysis.summary}</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-6xl font-bold text-blue-600 mb-1">{imageAnalysis.overall_score}</div>
                  <div className="text-base text-gray-600 font-medium">Overall Score</div>
                </div>
              </div>
              
              {/* Score Grid - Secondary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-5">
                  <div className="text-sm text-gray-600 mb-2 font-medium">UI/UX Score</div>
                  <div className="text-3xl font-bold text-gray-900">{imageAnalysis.ui_ux_score}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-5">
                  <div className="text-sm text-gray-600 mb-2 font-medium">Content Score</div>
                  <div className="text-3xl font-bold text-gray-900">{imageAnalysis.content_score}</div>
                </div>
              </div>
            </div>

            {/* UI/UX Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">UI/UX Analysis</h3>
                {imageAnalysis.mobile && (
                  <p className="text-sm text-gray-500">Desktop View Analysis</p>
                )}
              </div>
              {primaryAnalysis.ui_ux_analysis && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.layout_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Layout</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.color_scheme_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Colors</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.typography_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Typography</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.spacing_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Spacing</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.visual_hierarchy_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Hierarchy</div>
                </div>
                {primaryAnalysis.ui_ux_analysis.accessibility_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.accessibility_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Accessibility</div>
                  </div>
                )}
                {primaryAnalysis.ui_ux_analysis.mobile_responsiveness_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.mobile_responsiveness_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Mobile</div>
                  </div>
                )}
                {primaryAnalysis.ui_ux_analysis.navigation_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.navigation_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Navigation</div>
                  </div>
                )}
                {primaryAnalysis.ui_ux_analysis.call_to_action_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.ui_ux_analysis.call_to_action_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">CTA</div>
                  </div>
                )}
              </div>
              )}

              {/* Detailed Metrics */}
              {primaryAnalysis.ui_ux_analysis?.detailed_metrics && (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-base font-semibold text-gray-900 mb-5">Detailed Metrics</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {primaryAnalysis.ui_ux_analysis.detailed_metrics.color_contrast_ratio && (
                <div>
                        <span className="font-medium text-gray-700">Color Contrast:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.ui_ux_analysis.detailed_metrics.color_contrast_ratio}</span>
                      </div>
                    )}
                    {primaryAnalysis.ui_ux_analysis.detailed_metrics.font_sizes_used && primaryAnalysis.ui_ux_analysis.detailed_metrics.font_sizes_used.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Font Sizes:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.ui_ux_analysis.detailed_metrics.font_sizes_used.join(', ')}</span>
                      </div>
                    )}
                    {primaryAnalysis.ui_ux_analysis.detailed_metrics.spacing_consistency && (
                      <div>
                        <span className="font-medium text-gray-700">Spacing:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.ui_ux_analysis.detailed_metrics.spacing_consistency}</span>
                      </div>
                    )}
                    {primaryAnalysis.ui_ux_analysis.detailed_metrics.element_alignment && (
                      <div>
                        <span className="font-medium text-gray-700">Alignment:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.ui_ux_analysis.detailed_metrics.element_alignment}</span>
                      </div>
                    )}
                    {primaryAnalysis.ui_ux_analysis.detailed_metrics.visual_balance && (
                      <div>
                        <span className="font-medium text-gray-700">Visual Balance:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.ui_ux_analysis.detailed_metrics.visual_balance}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {primaryAnalysis.ui_ux_analysis?.strengths && primaryAnalysis.ui_ux_analysis.strengths.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h5 className="text-base font-semibold text-gray-900 mb-4">Strengths</h5>
                  <ul className="space-y-3">
                    {primaryAnalysis.ui_ux_analysis.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start group">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 group-hover:bg-blue-200 transition-colors">
                          <span className="text-blue-600 text-xs font-bold">✓</span>
                        </span>
                        <span className="text-sm text-gray-700 flex-1 leading-relaxed">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {primaryAnalysis.ui_ux_analysis?.issues && primaryAnalysis.ui_ux_analysis.issues.length > 0 && (
                <div>
                  <h5 className="text-base font-semibold text-gray-900 mb-5">Issues & Recommendations</h5>
                  <div className="space-y-4">
                    {primaryAnalysis.ui_ux_analysis.issues.map((issue: { type: string; severity: 'high' | 'medium' | 'low'; description: string; suggestion: string; location?: string; impact?: string }, idx: number) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 shadow-sm ${
                        issue.severity === 'high' ? 'border-red-400 bg-red-50/50' :
                        issue.severity === 'medium' ? 'border-yellow-400 bg-yellow-50/50' :
                        'border-blue-400 bg-blue-50/50'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="text-sm font-semibold text-gray-900 leading-snug">{issue.description}</div>
                            <div className="text-xs text-gray-600 leading-relaxed">{issue.suggestion}</div>
                            {(issue.location || issue.impact) && (
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1">
                                {issue.location && (
                                  <span className="flex items-center">
                                    <span className="mr-1">📍</span>
                                    {issue.location}
                                  </span>
                                )}
                                {issue.impact && (
                                  <span className="flex items-center">
                                    <span className="mr-1">⚡</span>
                                    {issue.impact}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Content Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.content_analysis?.readability_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Readability</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.content_analysis?.clarity_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Clarity</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.content_analysis?.structure_score}</div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Structure</div>
                </div>
                {primaryAnalysis.content_analysis?.seo_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.content_analysis.seo_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">SEO</div>
                  </div>
                )}
                {primaryAnalysis.content_analysis?.content_length_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.content_analysis.content_length_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Length</div>
                  </div>
                )}
                {primaryAnalysis.content_analysis?.heading_structure_score !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-5 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{primaryAnalysis.content_analysis.heading_structure_score}</div>
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Headings</div>
                  </div>
                )}
              </div>

              {/* Content Detailed Metrics */}
              {primaryAnalysis.content_analysis?.detailed_metrics && (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-base font-semibold text-gray-900 mb-5">Content Metrics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    {primaryAnalysis.content_analysis.detailed_metrics.word_count_estimate !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Words:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.content_analysis.detailed_metrics.word_count_estimate.toLocaleString()}</span>
                      </div>
                    )}
                    {primaryAnalysis.content_analysis.detailed_metrics.heading_count !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Headings:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.content_analysis.detailed_metrics.heading_count}</span>
                      </div>
                    )}
                    {primaryAnalysis.content_analysis.detailed_metrics.paragraph_count !== undefined && (
                      <div>
                        <span className="font-medium text-gray-700">Paragraphs:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.content_analysis.detailed_metrics.paragraph_count}</span>
                      </div>
                    )}
                    {primaryAnalysis.content_analysis.detailed_metrics.list_usage && (
                      <div>
                        <span className="font-medium text-gray-700">Lists:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.content_analysis.detailed_metrics.list_usage}</span>
                      </div>
                    )}
                    {primaryAnalysis.content_analysis.detailed_metrics.content_density && (
                      <div>
                        <span className="font-medium text-gray-700">Density:</span>
                        <span className="ml-2 text-gray-600">{primaryAnalysis.content_analysis.detailed_metrics.content_density}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {primaryAnalysis.content_analysis?.strengths && primaryAnalysis.content_analysis.strengths.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h5 className="text-base font-semibold text-gray-900 mb-4">Content Strengths</h5>
                  <ul className="space-y-3">
                    {primaryAnalysis.content_analysis.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start group">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-3 group-hover:bg-blue-200 transition-colors">
                          <span className="text-blue-600 text-xs font-bold">✓</span>
                        </span>
                        <span className="text-sm text-gray-700 flex-1 leading-relaxed">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {primaryAnalysis.content_analysis?.issues && primaryAnalysis.content_analysis.issues.length > 0 && (
                <div>
                  <h5 className="text-base font-semibold text-gray-900 mb-5">Content Issues</h5>
                  <div className="space-y-4">
                    {primaryAnalysis.content_analysis.issues.map((issue: { type: string; severity: 'high' | 'medium' | 'low'; description: string; suggestion: string; location?: string }, idx: number) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 shadow-sm ${
                        issue.severity === 'high' ? 'border-red-400 bg-red-50/50' :
                        issue.severity === 'medium' ? 'border-yellow-400 bg-yellow-50/50' :
                        'border-blue-400 bg-blue-50/50'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="text-sm font-semibold text-gray-900 leading-snug">{issue.description}</div>
                            <div className="text-xs text-gray-600 leading-relaxed">{issue.suggestion}</div>
                            {issue.location && (
                              <div className="text-xs text-gray-500 pt-1 flex items-center">
                                <span className="mr-1">📍</span>
                                {issue.location}
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide flex-shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Design Patterns */}
            {primaryAnalysis.design_patterns && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Design Patterns & Best Practices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {primaryAnalysis.design_patterns.identified_patterns && primaryAnalysis.design_patterns.identified_patterns.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Identified Patterns:</div>
                      <div className="flex flex-wrap gap-2">
                        {primaryAnalysis.design_patterns.identified_patterns.map((pattern: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{pattern}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {primaryAnalysis.design_patterns.modern_design_elements && primaryAnalysis.design_patterns.modern_design_elements.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-2">Modern Elements:</div>
                      <div className="flex flex-wrap gap-2">
                        {primaryAnalysis.design_patterns.modern_design_elements.map((element: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">{element}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {primaryAnalysis.design_patterns.outdated_elements && primaryAnalysis.design_patterns.outdated_elements.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-700 mb-2">Outdated Elements:</div>
                      <div className="flex flex-wrap gap-2">
                        {primaryAnalysis.design_patterns.outdated_elements.map((element: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">{element}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {primaryAnalysis.design_patterns.best_practices_followed && primaryAnalysis.design_patterns.best_practices_followed.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Best Practices Followed:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {primaryAnalysis.design_patterns.best_practices_followed.map((practice: string, idx: number) => (
                          <li key={idx}>{practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryAnalysis.design_patterns.best_practices_missing && primaryAnalysis.design_patterns.best_practices_missing.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-orange-700 mb-2">Missing Best Practices:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {primaryAnalysis.design_patterns.best_practices_missing.map((practice: string, idx: number) => (
                          <li key={idx}>{practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Brand Consistency */}
            {primaryAnalysis.brand_consistency && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Brand Consistency</h3>
                {primaryAnalysis.brand_consistency.score !== undefined && (
                  <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200/50 inline-block">
                    <div className="text-4xl font-bold text-gray-900 mb-1">{primaryAnalysis.brand_consistency.score}</div>
                    <div className="text-sm text-gray-600 font-medium">Consistency Score</div>
                  </div>
                )}
                <div className="space-y-3 mb-4">
                  {primaryAnalysis.brand_consistency.color_consistency && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Color Consistency:</div>
                      <div className="text-sm text-gray-600">{primaryAnalysis.brand_consistency.color_consistency}</div>
                    </div>
                  )}
                  {primaryAnalysis.brand_consistency.typography_consistency && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Typography Consistency:</div>
                      <div className="text-sm text-gray-600">{primaryAnalysis.brand_consistency.typography_consistency}</div>
                    </div>
                  )}
                  {primaryAnalysis.brand_consistency.style_consistency && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Style Consistency:</div>
                      <div className="text-sm text-gray-600">{primaryAnalysis.brand_consistency.style_consistency}</div>
                    </div>
                  )}
                </div>
                {primaryAnalysis.brand_consistency.issues && primaryAnalysis.brand_consistency.issues.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Consistency Issues:</div>
                    <div className="space-y-2">
                      {primaryAnalysis.brand_consistency.issues.map((issue: { description: string; suggestion: string }, idx: number) => (
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
            {primaryAnalysis.detailed_summary && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl border border-blue-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Detailed Assessment</h3>
                {primaryAnalysis.detailed_summary.overall_assessment && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Overall Assessment:</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{primaryAnalysis.detailed_summary.overall_assessment}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {primaryAnalysis.detailed_summary.key_strengths && primaryAnalysis.detailed_summary.key_strengths.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-2">Key Strengths:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {primaryAnalysis.detailed_summary.key_strengths.map((strength: string, idx: number) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryAnalysis.detailed_summary.key_weaknesses && primaryAnalysis.detailed_summary.key_weaknesses.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-700 mb-2">Key Weaknesses:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {primaryAnalysis.detailed_summary.key_weaknesses.map((weakness: string, idx: number) => (
                          <li key={idx}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryAnalysis.detailed_summary.quick_wins && primaryAnalysis.detailed_summary.quick_wins.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-blue-700 mb-2">Quick Wins:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {primaryAnalysis.detailed_summary.quick_wins.map((win: string, idx: number) => (
                          <li key={idx}>{win}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryAnalysis.detailed_summary.long_term_improvements && primaryAnalysis.detailed_summary.long_term_improvements.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-purple-700 mb-2">Long-term Improvements:</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {primaryAnalysis.detailed_summary.long_term_improvements.map((improvement: string, idx: number) => (
                          <li key={idx}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {primaryAnalysis.recommendations && primaryAnalysis.recommendations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Actionable Recommendations</h3>
                <div className="space-y-4">
                  {primaryAnalysis.recommendations.map((rec: string | { category?: string; priority?: 'high' | 'medium' | 'low'; title?: string; description?: string; impact?: string; effort?: 'low' | 'medium' | 'high' }, idx: number) => {
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
          )
        })()}

        {/* Screenshots - Only show after analysis is complete */}
        
        
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
