import { PageSpeedInsightsData } from '@/types/audit'

export interface PageSpeedInsightsResponse {
  data: PageSpeedInsightsData | null
  error: string | null
}

// Mock data generator for development/testing
function generateMockPageSpeedData(url: string): PageSpeedInsightsData {
  return {
    lighthouseResult: {
      categories: {
        performance: {
          score: 0.85,
          title: 'Performance'
        },
        accessibility: {
          score: 0.92,
          title: 'Accessibility'
        },
        'best-practices': {
          score: 0.78,
          title: 'Best Practices'
        },
        seo: {
          score: 0.88,
          title: 'SEO'
        }
      },
      audits: {
        'first-contentful-paint': {
          displayValue: '1.2 s',
          score: 0.9,
          title: 'First Contentful Paint'
        },
        'largest-contentful-paint': {
          displayValue: '2.1 s',
          score: 0.8,
          title: 'Largest Contentful Paint'
        },
        'cumulative-layout-shift': {
          displayValue: '0.05',
          score: 0.9,
          title: 'Cumulative Layout Shift'
        },
        'speed-index': {
          displayValue: '1.8 s',
          score: 0.85,
          title: 'Speed Index'
        },
        'total-blocking-time': {
          displayValue: '150 ms',
          score: 0.75,
          title: 'Total Blocking Time'
        },
        'interactive': {
          displayValue: '2.5 s',
          score: 0.8,
          title: 'Time to Interactive'
        }
      },
      configSettings: {
        formFactor: 'desktop',
        locale: 'en-US'
      },
      fetchTime: new Date().toISOString(),
      finalUrl: url,
      runWarnings: [],
      userAgent: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
    },
    loadingExperience: {
      metrics: {
        'FIRST_CONTENTFUL_PAINT_MS': {
          category: 'FAST',
          distributions: [
            { min: 0, max: 1000, proportion: 0.7 },
            { min: 1000, max: 2500, proportion: 0.25 },
            { min: 2500, max: 4000, proportion: 0.05 }
          ],
          percentile: 1200
        },
        'LARGEST_CONTENTFUL_PAINT_MS': {
          category: 'FAST',
          distributions: [
            { min: 0, max: 2500, proportion: 0.8 },
            { min: 2500, max: 4000, proportion: 0.15 },
            { min: 4000, max: 6000, proportion: 0.05 }
          ],
          percentile: 2100
        },
        'CUMULATIVE_LAYOUT_SHIFT_SCORE': {
          category: 'FAST',
          distributions: [
            { min: 0, max: 0.1, proportion: 0.85 },
            { min: 0.1, max: 0.25, proportion: 0.1 },
            { min: 0.25, max: 0.5, proportion: 0.05 }
          ],
          percentile: 0.05
        }
      },
      overall_category: 'FAST'
    },
    version: {
      major: 1,
      minor: 0
    }
  }
}

export async function fetchPageSpeedInsights(url: string): Promise<PageSpeedInsightsResponse> {
  try {
    // Debug: Log all environment variables that start with PAGESPEED
    console.log('🔍 PageSpeed Environment variables check:')
    console.log('NEXT_PUBLIC_PAGESPEED_API_KEY:', process.env.NEXT_PUBLIC_PAGESPEED_API_KEY ? 'Found' : 'Not found')
    
    const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY
    
    if (!apiKey) {
      console.error('❌ PageSpeed API key not found in environment variables')
      
      // For development/testing, return a mock response instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Development mode: Using mock PageSpeed data')
        return {
          data: generateMockPageSpeedData(url),
          error: null
        }
      }
      
      return {
        data: null,
        error: 'PageSpeed API key not configured. Please add NEXT_PUBLIC_PAGESPEED_API_KEY to your .env.local file.'
      }
    }

    console.log('🔍 Fetching PageSpeed Insights for URL:', url)
    
    // Ensure URL has protocol
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`
    
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(formattedUrl)}&key=${apiKey}&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo&screenshot=true`
    
    console.log('🌐 PageSpeed API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PageSpeed API error:', response.status, errorText)
      return {
        data: null,
        error: `PageSpeed API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    console.log('✅ PageSpeed Insights data received:', data)
    
    return {
      data: data as PageSpeedInsightsData,
      error: null
    }
  } catch (error) {
    console.error('❌ PageSpeed Insights fetch error:', error)
    return {
      data: null,
      error: `Failed to fetch PageSpeed Insights: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export function formatPageSpeedScore(score: number): string {
  if (score >= 0.9) return 'Excellent'
  if (score >= 0.8) return 'Good'
  if (score >= 0.6) return 'Needs Improvement'
  return 'Poor'
}

export function getScoreColor(score: number): string {
  if (score >= 0.9) return 'text-green-600'
  if (score >= 0.8) return 'text-blue-600'
  if (score >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

export function getScoreBgColor(score: number): string {
  if (score >= 0.9) return 'bg-green-100'
  if (score >= 0.8) return 'bg-blue-100'
  if (score >= 0.6) return 'bg-yellow-100'
  return 'bg-red-100'
}
