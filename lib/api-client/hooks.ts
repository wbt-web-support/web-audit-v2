/**
 * React Hooks for Screenshot API
 * Custom hooks for easy integration with React components
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { apiClient, createApiClient } from './api-client'
import type {
  ApiError,
  ApiKeyLocation,
  ScreenshotOptions,
  ScreenshotResponse,
  ScreenshotsListResponse,
  ServerStatusResponse,
} from './types'

interface UseScreenshotOptions {
  onSuccess?: (response: ScreenshotResponse) => void
  onError?: (error: ApiError) => void
  apiKeyLocation?: ApiKeyLocation
  customClient?: ReturnType<typeof createApiClient>
}

interface UseScreenshotReturn {
  takeScreenshot: (url: string, options?: ScreenshotOptions, pageId?: string) => Promise<ScreenshotResponse | null>
  isProcessing: boolean
  error: ApiError | null
  clearError: () => void
  lastResponse: ScreenshotResponse | null
}

/**
 * Hook for taking screenshots
 */
export function useScreenshot(options: UseScreenshotOptions = {}): UseScreenshotReturn {
  const { onSuccess, onError, apiKeyLocation = 'header', customClient } = options
  const client = customClient || apiClient
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [lastResponse, setLastResponse] = useState<ScreenshotResponse | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const takeScreenshot = useCallback(
    async (
      url: string,
      screenshotOptions?: ScreenshotOptions,
      pageId?: string
    ): Promise<ScreenshotResponse | null> => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      setIsProcessing(true)
      setError(null)

      try {
        const response = pageId
          ? await client.takeScreenshotWithPageId(url, pageId, screenshotOptions, apiKeyLocation)
          : await client.takeScreenshot(url, screenshotOptions, apiKeyLocation)

        setLastResponse(response)
        onSuccess?.(response)
        return response
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'Failed to take screenshot',
          code: err.code || 'UNKNOWN_ERROR',
          status: err.status || 0,
          details: err.details || err.message || 'An unknown error occurred',
          originalError: err.originalError || err,
        }

        // Log error details in development
        if (process.env.NODE_ENV === 'development') {
          console.error('⚠️ useScreenshot hook error:', {
            message: apiError.message,
            code: apiError.code,
            status: apiError.status,
            details: apiError.details,
            fullError: err,
          })
        }

        setError(apiError)
        onError?.(apiError)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [client, apiKeyLocation, onSuccess, onError]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    takeScreenshot,
    isProcessing,
    error,
    clearError,
    lastResponse,
  }
}

interface UseScreenshotsListOptions {
  onSuccess?: (response: ScreenshotsListResponse) => void
  onError?: (error: ApiError) => void
  apiKeyLocation?: ApiKeyLocation
  autoFetch?: boolean
  params?: { page?: number; limit?: number }
  customClient?: ReturnType<typeof createApiClient>
}

interface UseScreenshotsListReturn {
  screenshots: ScreenshotsListResponse | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  clearError: () => void
}

/**
 * Hook for fetching screenshots list
 */
export function useScreenshotsList(
  options: UseScreenshotsListOptions = {}
): UseScreenshotsListReturn {
  const {
    onSuccess,
    onError,
    apiKeyLocation = 'header',
    autoFetch = false,
    params,
    customClient,
  } = options
  const client = customClient || apiClient
  const [screenshots, setScreenshots] = useState<ScreenshotsListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchScreenshots = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await client.getScreenshots(params, apiKeyLocation)
      setScreenshots(response)
      onSuccess?.(response)
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'Failed to fetch screenshots',
        code: err.code,
        status: err.status,
        details: err.details,
        originalError: err.originalError || err,
      }

      setError(apiError)
      onError?.(apiError)
    } finally {
      setIsLoading(false)
    }
  }, [client, apiKeyLocation, params, onSuccess, onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchScreenshots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch])

  return {
    screenshots,
    isLoading,
    error,
    refetch: fetchScreenshots,
    clearError,
  }
}

interface UseServerStatusOptions {
  onSuccess?: (response: ServerStatusResponse) => void
  onError?: (error: ApiError) => void
  apiKeyLocation?: ApiKeyLocation
  autoFetch?: boolean
  pollInterval?: number
  customClient?: ReturnType<typeof createApiClient>
}

interface UseServerStatusReturn {
  status: ServerStatusResponse | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  clearError: () => void
}

/**
 * Hook for fetching server status
 */
export function useServerStatus(
  options: UseServerStatusOptions = {}
): UseServerStatusReturn {
  const {
    onSuccess,
    onError,
    apiKeyLocation = 'header',
    autoFetch = false,
    pollInterval,
    customClient,
  } = options
  const client = customClient || apiClient
  const [status, setStatus] = useState<ServerStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await client.getStatus(apiKeyLocation)
      setStatus(response)
      onSuccess?.(response)
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'Failed to fetch server status',
        code: err.code,
        status: err.status,
        details: err.details,
        originalError: err.originalError || err,
      }

      setError(apiError)
      onError?.(apiError)
    } finally {
      setIsLoading(false)
    }
  }, [client, apiKeyLocation, onSuccess, onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchStatus()

      // Set up polling if interval is provided
      if (pollInterval && pollInterval > 0) {
        const interval = setInterval(() => {
          fetchStatus()
        }, pollInterval)

        return () => clearInterval(interval)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, pollInterval])

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
    clearError,
  }
}

