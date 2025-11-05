/**
 * Screenshot API Client
 * Main export file for the API client library
 */

export { ApiClient, createApiClient, apiClient } from './api-client'
export { useScreenshot, useScreenshotsList, useServerStatus } from './hooks'
export type {
  ApiClientConfig,
  ApiError,
  ApiKeyLocation,
  ScreenshotOptions,
  ScreenshotRequest,
  ScreenshotResponse,
  ScreenshotListItem,
  ScreenshotsListResponse,
  ServerStatusResponse,
} from './types'

