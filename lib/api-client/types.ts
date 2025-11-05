/**
 * API Client Types
 * TypeScript definitions for the screenshot API client
 */

export interface ScreenshotOptions {
  width?: number
  height?: number
  fullPage?: boolean
  delay?: number
  waitFor?: string
  timeout?: number
  viewport?: {
    width: number
    height: number
  }
  [key: string]: any
}

export interface ScreenshotRequest {
  url: string
  options?: ScreenshotOptions
  priority?: number
}

export interface ScreenshotResponse {
  success: boolean | 'partial'
  url?: string
  desktopUrl?: string
  mobileUrl?: string
  desktop?: {
    screenshotUrl: string
    url: string
    filename?: string
    filePath?: string
    pageUrl?: string
    size?: number
    sizeKB?: number
    timestamp?: string
    supabasePath?: string
    uploadError?: string | null
    viewport?: {
      width: number
      height: number
    }
    [key: string]: any
  } | null
  mobile?: {
    screenshotUrl: string
    url: string
    filename?: string
    filePath?: string
    pageUrl?: string
    size?: number
    sizeKB?: number
    timestamp?: string
    supabasePath?: string
    uploadError?: string | null
    viewport?: {
      width: number
      height: number
    }
    [key: string]: any
  } | null
  screenshots?: {
    desktop?: ScreenshotResponse['desktop']
    mobile?: ScreenshotResponse['mobile']
  }
  warning?: string
  error?: string
  message?: string
  details?: string
  code?: string
  data?: any
}

export interface ScreenshotListItem {
  id: string
  url: string
  screenshotUrl: string
  createdAt: string
  updatedAt: string
  status: 'completed' | 'processing' | 'failed'
  [key: string]: any
}

export interface ScreenshotsListResponse {
  success: boolean
  screenshots: ScreenshotListItem[]
  total: number
  page?: number
  limit?: number
}

export interface ServerStatusResponse {
  success: boolean
  status: 'online' | 'offline' | 'maintenance'
  version?: string
  queue?: {
    total: number
    processing: number
    pending: number
    completed: number
    failed: number
  }
  uptime?: number
  timestamp: string
}

export interface ApiClientConfig {
  baseURL: string
  apiKey: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: string
  originalError?: Error
}

export type ApiKeyLocation = 'header' | 'bearer' | 'query'

