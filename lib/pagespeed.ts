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

    
    
    // Ensure URL has protocol
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`
    
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(formattedUrl)}&key=${apiKey}&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo&screenshot=true`
    
    
    
    // Retry logic for PageSpeed Insights request
    const makePageSpeedRequest = async (retries = 3, delay = 1000): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            
            controller.abort()
          }, 180000) // 3 minute timeout
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'WebAudit/1.0'
            },
            signal: controller.signal,
            mode: 'cors'
          })
          
          clearTimeout(timeoutId)
          
          
          
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error response')
            console.error('❌ PageSpeed API error response:', errorText)
            
            // Handle specific error cases
            if (response.status === 500) {
              try {
                const errorData = JSON.parse(errorText)
                if (errorData.error?.reason === 'lighthouseError') {
                  throw new Error('PageSpeed Insights is temporarily unavailable due to Lighthouse processing issues. Please try again later.')
                }
              } catch {
                // If we can't parse the error, use a generic message
              }
            }
            
            throw new Error(`PageSpeed API error: ${response.status} - ${response.statusText}. Details: ${errorText}`)
          }
          
          return response
        } catch (error) {
          console.error(`❌ PageSpeed request attempt ${i + 1} failed:`, error)
          console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            cause: error instanceof Error ? error.cause : undefined
          })
          
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('PageSpeed request timed out after 3 minutes')
          }
          
          if (error instanceof Error && error.message.includes('Failed to fetch')) {
            console.error('🔍 PageSpeed network error details:', {
              apiUrl,
              isOnline: navigator.onLine,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            })
          }
          
          if (i === retries - 1) {
            // Enhanced error message for the final attempt
            let enhancedError = error instanceof Error ? error.message : String(error)
            if (enhancedError.includes('Failed to fetch')) {
              enhancedError = `Network connection failed for PageSpeed Insights. Please check your internet connection and try again.`
            }
            throw new Error(enhancedError)
          }
          
          // Wait before retrying with exponential backoff
          const waitTime = delay * Math.pow(2, i) // Exponential backoff
          
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
      
      throw new Error('All PageSpeed request attempts failed')
    }
    
    const response = await makePageSpeedRequest()

    const data = await response.json()
    
    
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
