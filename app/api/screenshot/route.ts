import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
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
    const apiKey = process.env.SCRAPER_API_KEY
    
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
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey
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
      priority: screenshotData.priority
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
      
      // Check if API returned an error response (success: false)
      if (data.success === false) {
        console.error('❌ Screenshot API returned error:', {
          error: data.error,
          message: data.message,
          errorType: data.errorType,
          retryable: data.retryable
        })
        
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
      
      // Extract URL from nested data object (API returns: { success, message, data: { url, imageUrl, screenshotUrl } })
      const imageUrl = data.data?.url || data.data?.imageUrl || data.data?.screenshotUrl || data.url || data.imageUrl || data.screenshotUrl
      
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
          const pageImageData = {
            url: imageUrl,
            filename: data.data?.filename || null,
            filePath: data.data?.filePath || null,
            pageUrl: data.data?.pageUrl || body.url,
            size: data.data?.size || null,
            sizeKB: data.data?.sizeKB || null,
            timestamp: data.data?.timestamp || new Date().toISOString(),
            supabasePath: data.data?.supabasePath || null,
            uploadError: data.data?.uploadError || null
          }

          const { error: updateError } = await supabaseAdmin
            .from('scraped_pages')
            .update({ page_image: pageImageData })
            .eq('id', body.pageId)

          if (updateError) {
            console.error('❌ Error saving page_image to database:', updateError)
            // Don't fail the request if database save fails, just log it
          } else {
            console.log('✅ Screenshot saved to database for page:', body.pageId)
          }
        } catch (dbError) {
          console.error('❌ Error saving screenshot to database:', dbError)
          // Don't fail the request if database save fails
        }
      }

      return NextResponse.json({
        success: true,
        url: imageUrl,
        data: data
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

