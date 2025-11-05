/**
 * Screenshot API Client
 * A reusable client for making authenticated requests to the screenshot API
 */

import type {
  ApiClientConfig,
  ApiError,
  ApiKeyLocation,
  ScreenshotRequest,
  ScreenshotResponse,
  ScreenshotsListResponse,
  ServerStatusResponse,
} from './types'

export class ApiClient {
  private baseURL: string
  private apiKey: string
  private timeout: number
  private retries: number
  private retryDelay: number

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = config.apiKey
    this.timeout = config.timeout || 300000 // 5 minutes default
    this.retries = config.retries || 3
    this.retryDelay = config.retryDelay || 1000 // 1 second default

    if (!this.apiKey) {
      console.warn('⚠️ API Client: No API key provided. Requests may fail.')
    }
  }

  /**
   * Create headers with API key authentication
   */
  private createHeaders(apiKeyLocation: ApiKeyLocation = 'header'): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    switch (apiKeyLocation) {
      case 'header':
        headers['X-API-Key'] = this.apiKey
        break
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.apiKey}`
        break
      // query parameter is handled in the request method
    }

    return headers
  }

  /**
   * Make an authenticated request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    apiKeyLocation: ApiKeyLocation = 'header'
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    // Handle query parameter API key location
    const finalUrl = apiKeyLocation === 'query' 
      ? `${url}${url.includes('?') ? '&' : '?'}apiKey=${encodeURIComponent(this.apiKey)}`
      : url

    const headers = this.createHeaders(apiKeyLocation === 'query' ? 'header' : apiKeyLocation)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    let lastError: ApiError | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(finalUrl, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle 401 Unauthorized
        if (response.status === 401) {
          // Parse error response BEFORE logging (response can only be read once)
          const errorData = await this.parseErrorResponse(response)
          
          const error: ApiError = {
            message: errorData?.error || errorData?.message || 'Unauthorized: Invalid or missing API key',
            code: errorData?.code || 'UNAUTHORIZED',
            status: 401,
            details: errorData?.details || errorData?.error || 'Please check your API key configuration. Make sure NEXT_PUBLIC_SCREENSHOT_API_KEY is set in your .env.local file and matches SCREENSHOT_API_KEY on the server.',
          }
          
          // Log detailed error information
          console.error('❌ API Client: Authentication failed', {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.details,
            hasApiKey: !!this.apiKey,
            apiKeyLength: this.apiKey?.length || 0,
            apiKeyPrefix: this.apiKey?.substring(0, 8) + '...' || 'N/A',
            baseURL: this.baseURL,
            endpoint: url,
            serverResponse: errorData,
          })
          
          throw error
        }

        // Handle other error status codes
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          const error: ApiError = {
            message: errorData.message || `Request failed with status ${response.status}`,
            code: errorData.code || 'REQUEST_FAILED',
            status: response.status,
            details: errorData.details || errorData.error || response.statusText,
          }
          
          // Don't retry on client errors (4xx), except 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error
          }
          
          // Retry on server errors (5xx) and rate limits (429)
          lastError = error
          if (attempt < this.retries) {
            const delay = this.retryDelay * Math.pow(2, attempt) // Exponential backoff
            console.warn(`⚠️ API Client: Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retries})`)
            await this.sleep(delay)
            continue
          }
          throw error
        }

        // Parse successful response
        const data = await response.json()
        return data as T
      } catch (error: any) {
        clearTimeout(timeoutId)

        // Handle abort (timeout)
        if (error.name === 'AbortError' || controller.signal.aborted) {
          const timeoutError: ApiError = {
            message: 'Request timeout',
            code: 'TIMEOUT',
            status: 504,
            details: `Request exceeded ${this.timeout}ms timeout`,
            originalError: error,
          }
          throw timeoutError
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          lastError = {
            message: 'Network error',
            code: 'NETWORK_ERROR',
            status: 0,
            details: 'Failed to connect to the API server. Please check your connection.',
            originalError: error,
          }
          
          if (attempt < this.retries) {
            const delay = this.retryDelay * Math.pow(2, attempt)
            console.warn(`⚠️ API Client: Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retries})`)
            await this.sleep(delay)
            continue
          }
          throw lastError
        }

        // Re-throw API errors
        if (error.code) {
          throw error
        }

        // Unknown error
        lastError = {
          message: error.message || 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
          status: 0,
          details: 'An unexpected error occurred',
          originalError: error,
        }

        if (attempt < this.retries) {
          const delay = this.retryDelay * Math.pow(2, attempt)
          console.warn(`⚠️ API Client: Error occurred, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retries})`)
          await this.sleep(delay)
          continue
        }

        throw lastError
      }
    }

    throw lastError || {
      message: 'Request failed after all retries',
      code: 'MAX_RETRIES_EXCEEDED',
      status: 0,
    }
  }

  /**
   * Parse error response from API
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      // Clone the response so we can read it multiple times
      const clonedResponse = response.clone()
      const text = await clonedResponse.text()
      
      if (!text || text.trim() === '') {
        return { 
          message: response.statusText || 'Unknown error', 
          status: response.status,
          error: response.statusText || 'Unknown error'
        }
      }
      
      try {
        const parsed = JSON.parse(text)
        return parsed
      } catch (parseError) {
        // If JSON parsing fails, return the text as the message
        return { 
          message: text, 
          status: response.status,
          error: text,
          details: text
        }
      }
    } catch (error) {
      console.error('Error parsing error response:', error)
      return { 
        message: response.statusText || 'Unknown error', 
        status: response.status,
        error: response.statusText || 'Unknown error'
      }
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Take a screenshot of a URL
   */
  async takeScreenshot(
    url: string,
    options?: ScreenshotRequest['options'],
    apiKeyLocation: ApiKeyLocation = 'header'
  ): Promise<ScreenshotResponse> {
    const requestBody: ScreenshotRequest = {
      url,
      options: options || { delay: 3000 },
      priority: 1,
    }

    return this.request<ScreenshotResponse>(
      '/api/screenshot',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      apiKeyLocation
    )
  }

  /**
   * Take a screenshot with pageId (for database storage)
   */
  async takeScreenshotWithPageId(
    url: string,
    pageId: string,
    options?: ScreenshotRequest['options'],
    apiKeyLocation: ApiKeyLocation = 'header'
  ): Promise<ScreenshotResponse> {
    const requestBody: ScreenshotRequest & { pageId: string } = {
      url,
      pageId,
      options: options || { delay: 3000 },
      priority: 1,
    }

    return this.request<ScreenshotResponse>(
      '/api/screenshot',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      apiKeyLocation
    )
  }

  /**
   * Get list of screenshots
   */
  async getScreenshots(
    params?: { page?: number; limit?: number },
    apiKeyLocation: ApiKeyLocation = 'header'
  ): Promise<ScreenshotsListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `/screenshots${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    return this.request<ScreenshotsListResponse>(
      endpoint,
      {
        method: 'GET',
      },
      apiKeyLocation
    )
  }

  /**
   * Get server status
   */
  async getStatus(apiKeyLocation: ApiKeyLocation = 'header'): Promise<ServerStatusResponse> {
    return this.request<ServerStatusResponse>(
      '/status',
      {
        method: 'GET',
      },
      apiKeyLocation
    )
  }
}

/**
 * Create a default API client instance
 * Uses environment variables for configuration
 */
export function createApiClient(): ApiClient {
  const baseURL = process.env.NEXT_PUBLIC_SCREENSHOT_API_BASE_URL || 
                  process.env.NEXT_PUBLIC_API_BASE_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  
  const apiKey = process.env.NEXT_PUBLIC_SCREENSHOT_API_KEY || 
                 process.env.NEXT_PUBLIC_API_KEY || 
                 ''

  if (!apiKey) {
    console.warn('⚠️ API Client: NEXT_PUBLIC_SCREENSHOT_API_KEY not found in environment variables')
    console.warn('⚠️ API Client: Please add NEXT_PUBLIC_SCREENSHOT_API_KEY to your .env.local file')
  } else if (process.env.NODE_ENV === 'development') {
    console.log('✅ API Client: API key found', {
      hasApiKey: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      baseURL,
    })
  }

  return new ApiClient({
    baseURL,
    apiKey,
    timeout: 300000, // 5 minutes
    retries: 3,
    retryDelay: 1000, // 1 second
  })
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient()

