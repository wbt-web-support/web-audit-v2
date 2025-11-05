import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Validate API Key first - before processing any request
    const requiredApiKey = process.env.SCREENSHOT_API_KEY
    const providedApiKey = request.headers.get('X-API-Key')
    
    if (!requiredApiKey) {
      console.error('❌ SCREENSHOT_API_KEY not configured in environment variables')
      return NextResponse.json(
        {
          error: 'API key not configured',
          code: 'API_KEY_NOT_CONFIGURED'
        },
        {
          status: 500
        }
      )
    }
    
    if (!providedApiKey) {
      console.warn('⚠️ Screenshot API request without API key')
      return NextResponse.json(
        {
          error: 'API key required',
          details: 'Please provide X-API-Key header',
          code: 'MISSING_API_KEY'
        },
        {
          status: 401
        }
      )
    }
    
    if (providedApiKey !== requiredApiKey) {
      console.warn('⚠️ Screenshot API request with invalid API key')
      return NextResponse.json(
        {
          error: 'Invalid API key',
          code: 'INVALID_API_KEY'
        },
        {
          status: 401
        }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body?.url) {
      return NextResponse.json(
        {
          error: 'URL is required',
          code: 'MISSING_URL'
        },
        {
          status: 400
        }
      )
    }

    // Get API configuration from environment variables - use SCREENSHOT_API_BASE_URL
    let apiBaseUrl = process.env.SCREENSHOT_API_BASE_URL || 'http://localhost:3001'
    
    // Clean the URL by removing any leading '=' characters
    apiBaseUrl = apiBaseUrl.replace(/^=+/, '')
    
    // Get API key for external screenshot service
    // Try SCREENSHOT_API_KEY first (for consistency), then fall back to SCRAPER_API_KEY
    const apiKey = process.env.SCREENSHOT_API_KEY || process.env.SCRAPER_API_KEY
    
    // Allow custom screenshot endpoint path via environment variable
    const screenshotPath = process.env.SCREENSHOT_ENDPOINT_PATH || '/screenshot'
    const endpoint = `${apiBaseUrl}${screenshotPath}`

    // Check if we're using localhost and provide helpful error
    if (apiBaseUrl.includes('localhost') && !process.env.SCREENSHOT_API_BASE_URL) {
      console.warn('⚠️ Using default localhost screenshot service. Make sure the screenshot service is running on port 3001')
    }

    // Validate the endpoint URL
    try {
      new URL(endpoint)
    } catch (urlError) {
      console.error('❌ Invalid endpoint URL:', endpoint, urlError)
      return NextResponse.json(
        {
          error: 'Invalid API endpoint configuration',
          details: `Invalid URL: ${endpoint}`,
          code: 'INVALID_ENDPOINT'
        },
        {
          status: 500
        }
      )
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'WebAudit/1.0'
    }
    
    // Add API key for external screenshot service
    if (apiKey) {
      headers['X-API-Key'] = apiKey
    } else {
      console.warn('⚠️ No API key found for external screenshot service. Set SCREENSHOT_API_KEY or SCRAPER_API_KEY in environment variables.')
      console.warn('⚠️ External screenshot service at', endpoint, 'may require authentication')
    }

    // Prepare request body
    const screenshotData = {
      url: body.url,
      options: body.options || {
        delay: 3000
      },
      priority: body.priority || 1
    }

    // Log the request for debugging
    console.log('📸 Screenshot request:', {
      endpoint,
      url: body.url,
      options: screenshotData.options,
      priority: screenshotData.priority,
      hasApiKey: !!apiKey,
      apiKeySource: process.env.SCREENSHOT_API_KEY ? 'SCREENSHOT_API_KEY' : process.env.SCRAPER_API_KEY ? 'SCRAPER_API_KEY' : 'none'
    })

    // Make request to screenshot service with 5 minute timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 300000) // 5 minute timeout (300000ms)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(screenshotData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        
        // Parse HTML error responses
        let errorMessage = errorText
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          // Extract text content from HTML error
          const match = errorText.match(/<pre[^>]*>([^<]+)<\/pre>/i) || 
                        errorText.match(/<body[^>]*>([^<]+)<\/body>/i) ||
                        errorText.match(/Cannot (POST|GET|PUT|DELETE) ([^\s<]+)/i)
          if (match) {
            errorMessage = match[1] || match[0]
          }
        }
        
        console.error('❌ Screenshot API error:', {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          error: errorMessage,
          fullResponse: errorText.substring(0, 500) // First 500 chars for debugging
        })
        
        // If endpoint doesn't exist (404), provide helpful message
        if (response.status === 404) {
          return NextResponse.json(
            {
              error: 'Screenshot endpoint not found',
              details: `The endpoint ${endpoint} does not exist. Please verify the screenshot service is running and the endpoint path is correct.`,
              code: 'ENDPOINT_NOT_FOUND',
              status: response.status,
              suggestedEndpoint: endpoint
            },
            {
              status: 404
            }
          )
        }
        
        return NextResponse.json(
          {
            error: 'Screenshot service error',
            details: errorMessage || response.statusText,
            code: 'SCREENSHOT_SERVICE_ERROR',
            status: response.status
          },
          {
            status: response.status >= 400 && response.status < 500 ? response.status : 500
          }
        )
      }

      const data = await response.json()
      
      // Extract URLs even if success is false (partial success - desktop might still be available)
      const desktopUrl = data.desktop?.screenshotUrl ||
                        data.desktop?.url || 
                        data.desktop?.imageUrl || 
                        data.data?.desktop?.screenshotUrl ||
                        data.data?.desktop?.url ||
                        data.data?.desktop?.imageUrl ||
                        data.screenshots?.desktop?.screenshotUrl ||
                        data.screenshots?.desktop?.url || 
                        data.screenshots?.desktop?.imageUrl || 
                        data.data?.url || 
                        data.data?.imageUrl || 
                        data.data?.screenshotUrl || 
                        data.url || 
                        data.imageUrl || 
                        data.screenshotUrl
      
      const mobileUrl = data.mobile?.screenshotUrl ||
                       data.mobile?.url || 
                       data.mobile?.imageUrl || 
                       data.data?.mobile?.screenshotUrl ||
                       data.data?.mobile?.url ||
                       data.data?.mobile?.imageUrl ||
                       data.screenshots?.mobile?.screenshotUrl ||
                       data.screenshots?.mobile?.url || 
                       data.screenshots?.mobile?.imageUrl
      
      // Check if API returned an error response (success: false)
      if (data.success === false) {
        console.error('❌ Screenshot API returned error:', {
          error: data.error,
          message: data.message,
          errorType: data.errorType,
          retryable: data.retryable,
          desktopAvailable: !!desktopUrl,
          mobileAvailable: !!mobileUrl
        })
        
        // If desktop screenshot is available, return it with a warning about mobile failure
        if (desktopUrl) {
          console.warn('⚠️ Mobile screenshot failed, but desktop screenshot is available. Returning partial success.')
          
          // Continue processing with desktop only
          // Don't return error - proceed to save and return desktop screenshot
        } else {
          // No desktop screenshot available - return error
          return NextResponse.json(
            {
              error: data.error || 'Screenshot failed',
              details: data.message || 'Unknown error occurred',
              code: 'SCREENSHOT_API_ERROR',
              errorType: data.errorType,
              retryable: data.retryable
            },
            {
              status: data.errorType === 'timeout' ? 504 : 500
            }
          )
        }
      }
      
      // URLs already extracted above (before checking success: false)
      // Use desktop URL as primary if mobile not available
      const imageUrl = desktopUrl
      
      if (!imageUrl) {
        console.error('❌ No image URL found in response:', data)
        return NextResponse.json(
          {
            error: 'Invalid response format',
            details: 'The screenshot service did not return a valid image URL',
            code: 'INVALID_RESPONSE'
          },
          {
            status: 500
          }
        )
      }
      
      // Save to database if pageId is provided
      if (body.pageId) {
        try {
          // Try multiple possible locations for desktop and mobile data
          const desktopData = data.desktop || data.data?.desktop || data.screenshots?.desktop || data.data
          const mobileData = data.mobile || data.data?.mobile || data.screenshots?.mobile

          const pageImageData = {
            desktop: {
              url: desktopUrl,
              screenshotUrl: desktopUrl, // Store screenshotUrl explicitly
              filename: desktopData?.filename || null,
              filePath: desktopData?.filePath || null,
              pageUrl: desktopData?.pageUrl || desktopData?.url || data.data?.pageUrl || body.url,
              size: desktopData?.size || null,
              sizeKB: desktopData?.sizeKB || null,
              timestamp: desktopData?.timestamp || new Date().toISOString(),
              supabasePath: desktopData?.supabasePath || null,
              uploadError: desktopData?.uploadError || null,
              viewport: desktopData?.viewport || null
            },
            mobile: mobileUrl ? {
              url: mobileUrl,
              screenshotUrl: mobileUrl, // Store screenshotUrl explicitly
              filename: mobileData?.filename || null,
              filePath: mobileData?.filePath || null,
              pageUrl: mobileData?.pageUrl || mobileData?.url || data.data?.pageUrl || body.url,
              size: mobileData?.size || null,
              sizeKB: mobileData?.sizeKB || null,
              timestamp: mobileData?.timestamp || new Date().toISOString(),
              supabasePath: mobileData?.supabasePath || null,
              uploadError: mobileData?.uploadError || null,
              viewport: mobileData?.viewport || null
            } : null,
            // Keep legacy format for backward compatibility
            url: desktopUrl,
            screenshotUrl: desktopUrl,
            filename: desktopData?.filename || null,
            filePath: desktopData?.filePath || null,
            pageUrl: desktopData?.pageUrl || desktopData?.url || data.data?.pageUrl || body.url,
            size: desktopData?.size || null,
            sizeKB: desktopData?.sizeKB || null,
            timestamp: desktopData?.timestamp || new Date().toISOString(),
            supabasePath: desktopData?.supabasePath || null,
            uploadError: desktopData?.uploadError || null
          }

          const { error: updateError } = await supabaseAdmin
            .from('scraped_pages')
            .update({ page_image: pageImageData })
            .eq('id', body.pageId)

          if (updateError) {
            console.error('❌ Error saving page_image to database:', updateError)
            // Don't fail the request if database save fails, just log it
          } else {
            console.log('✅ Screenshots saved to database for page:', body.pageId, { 
              desktop: !!desktopUrl, 
              mobile: !!mobileUrl 
            })
          }
        } catch (dbError) {
          console.error('❌ Error saving screenshot to database:', dbError)
          // Don't fail the request if database save fails
        }
      }

      // Determine if this is a partial success (desktop OK, mobile failed)
      const isPartialSuccess = desktopUrl && !mobileUrl && data.success === false
      
      return NextResponse.json({
        success: isPartialSuccess ? 'partial' : true, // Use 'partial' to indicate partial success
        url: desktopUrl,
        desktopUrl,
        mobileUrl: mobileUrl || null,
        desktop: desktopUrl ? {
          screenshotUrl: desktopUrl,
          url: desktopUrl,
          ...data.desktop,
          ...data.data?.desktop
        } : null,
        mobile: mobileUrl ? {
          screenshotUrl: mobileUrl,
          url: mobileUrl,
          ...data.mobile,
          ...data.data?.mobile
        } : null,
        screenshots: {
          desktop: desktopUrl ? {
            url: desktopUrl,
            screenshotUrl: desktopUrl,
            ...data.screenshots?.desktop,
            ...data.desktop,
            ...data.data?.desktop
          } : null,
          mobile: mobileUrl ? {
            url: mobileUrl,
            screenshotUrl: mobileUrl,
            ...data.screenshots?.mobile,
            ...data.mobile,
            ...data.data?.mobile
          } : null
        },
        // Include warning if mobile failed but desktop succeeded
        warning: isPartialSuccess ? (data.message || 'Mobile screenshot failed, but desktop screenshot captured successfully') : undefined,
        data: data
      }, {
        status: 200 // Always return 200 for successful or partial success
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Check if it was aborted due to timeout
      if (fetchError.name === 'AbortError' || controller.signal.aborted) {
        console.error('❌ Screenshot request timeout after 5 minutes')
        return NextResponse.json(
          {
            error: 'Screenshot request timeout',
            details: 'The screenshot service did not respond within 5 minutes. The request may still be processing.',
            code: 'REQUEST_TIMEOUT'
          },
          {
            status: 504
          }
        )
      }
      
      throw fetchError // Re-throw other errors to be handled by outer catch
    }
  } catch (error) {
    console.error('❌ Screenshot API route error:', error)
    
    // Check if it's a network error (connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Failed to connect to screenshot service',
          details: 'The screenshot service may not be running or is unreachable',
          code: 'SERVICE_UNAVAILABLE'
        },
        {
          status: 503
        }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      {
        status: 500
      }
    )
  }
}

