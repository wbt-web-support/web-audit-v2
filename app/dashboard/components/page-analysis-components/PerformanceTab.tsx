'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { usePageAnalysisCache } from '../contexts/PageAnalysisCache'

interface PerformanceTabProps {
  page: any
  cachedAnalysis?: any
}

export default function PerformanceTab({ page, cachedAnalysis }: PerformanceTabProps) {
  const { updateScrapedPage } = useSupabase()
  const { data, refreshAnalysis } = usePageAnalysisCache()
  const [performanceData, setPerformanceData] = useState<any>(cachedAnalysis || null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const content = page.html_content || ''
  const images = page.images || []
  
  // Performance Analysis
  const responseTime = page.response_time || 0
  const contentLength = page.html_content_length || 0
  const imageCount = images.length
  const largeImages = images.filter((img: any) => img.size && img.size > 100000) // > 100KB
  const totalImageSize = images.reduce((total: number, img: any) => total + (img.size || 0), 0)
  
  // Check for performance optimizations
  const hasLazyLoading = images.some((img: any) => img.loading === 'lazy')
  const hasModernFormats = images.some((img: any) => img.format && ['webp', 'avif'].includes(img.format.toLowerCase()))
  const hasCompressedImages = images.some((img: any) => img.size && img.size < 50000) // < 50KB
  const hasAsyncScripts = content.includes('async') || content.includes('defer')
  const hasMinifiedCSS = content.includes('min.css') || content.includes('.min.')
  const hasMinifiedJS = content.includes('min.js') || content.includes('.min.')
  const hasCDN = content.includes('cdn') || content.includes('cloudflare') || content.includes('jsdelivr')
  const hasGzip = page.content_encoding && page.content_encoding.includes('gzip')
  
  // Calculate performance score
  const performanceScore = Math.round((
    (responseTime < 1000 ? 1 : responseTime < 2000 ? 0.5 : 0) +
    (contentLength < 100000 ? 1 : contentLength < 500000 ? 0.5 : 0) +
    (largeImages.length === 0 ? 1 : largeImages.length < imageCount * 0.3 ? 0.5 : 0) +
    (hasLazyLoading ? 1 : 0) +
    (hasModernFormats ? 1 : 0) +
    (hasAsyncScripts ? 1 : 0) +
    (hasMinifiedCSS ? 1 : 0) +
    (hasMinifiedJS ? 1 : 0) +
    (hasCDN ? 1 : 0) +
    (hasGzip ? 1 : 0)
  ) / 10 * 100)

  // Use cache context data
  useEffect(() => {
    if (data.performanceAnalysis) {
      setPerformanceData(data.performanceAnalysis)
    } else if (cachedAnalysis) {
      setPerformanceData(cachedAnalysis)
    } else if (page.performance_analysis) {
      setPerformanceData(page.performance_analysis)
    }
  }, [data.performanceAnalysis, cachedAnalysis, page.performance_analysis])

  // Update local state when cache changes
  useEffect(() => {
    setIsAnalyzing(data.isPerformanceLoading)
    setError(data.performanceError)
  }, [data.isPerformanceLoading, data.performanceError])

  const performPerformanceAnalysis = async () => {
    try {
      await refreshAnalysis('performance')
    } catch (err) {
      console.error('Error during performance analysis:', err)
    }
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Analyzing performance...</span>
            </div>
          </div>
          
          {/* Enhanced loading message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Performance Analysis in Progress</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>We're running comprehensive performance tests on your page. This typically takes 30-60 seconds to complete.</p>
                  <p className="mt-1 text-xs text-blue-600">Please don't close this page while the analysis is running.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
            <span className="text-sm text-red-600">Analysis failed</span>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Performance analysis failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={performPerformanceAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No data state - show loading instead of manual trigger
  if (!performanceData && !isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Starting analysis...</span>
            </div>
          </div>
          
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Preparing Performance Analysis</h3>
            <p className="mt-1 text-sm text-gray-500">This will start automatically...</p>
          </div>
        </div>
      </div>
    )
  }

  // Extract PageSpeed data
  const { lighthouseResult, loadingExperience } = performanceData
  const { categories, audits } = lighthouseResult

  return (
    <div className="space-y-6">
      {/* Overall Scores Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Overall Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${Math.round(categories.performance.score * 100) * 2.83} 283`}
                  strokeLinecap="round"
                  className={categories.performance.score > 0.9 ? 'text-green-500' : categories.performance.score > 0.5 ? 'text-yellow-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{Math.round(categories.performance.score * 100)}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mt-2 text-center">Performance</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${Math.round(categories.accessibility.score * 100) * 2.83} 283`}
                  strokeLinecap="round"
                  className={categories.accessibility.score > 0.9 ? 'text-green-500' : categories.accessibility.score > 0.5 ? 'text-yellow-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{Math.round(categories.accessibility.score * 100)}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mt-2 text-center">Accessibility</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${Math.round(categories['best-practices'].score * 100) * 2.83} 283`}
                  strokeLinecap="round"
                  className={categories['best-practices'].score > 0.9 ? 'text-green-500' : categories['best-practices'].score > 0.5 ? 'text-yellow-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{Math.round(categories['best-practices'].score * 100)}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mt-2 text-center">Best Practices</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${Math.round(categories.seo.score * 100) * 2.83} 283`}
                  strokeLinecap="round"
                  className={categories.seo.score > 0.9 ? 'text-green-500' : categories.seo.score > 0.5 ? 'text-yellow-500' : 'text-red-500'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{Math.round(categories.seo.score * 100)}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mt-2 text-center">SEO</h3>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">First Contentful Paint</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['first-contentful-paint']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['first-contentful-paint']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['first-contentful-paint']?.score > 0.9 ? 'Good' : audits['first-contentful-paint']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['first-contentful-paint']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Time to first content render</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Largest Contentful Paint</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['largest-contentful-paint']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['largest-contentful-paint']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['largest-contentful-paint']?.score > 0.9 ? 'Good' : audits['largest-contentful-paint']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['largest-contentful-paint']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Time to largest content render</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Cumulative Layout Shift</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['cumulative-layout-shift']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['cumulative-layout-shift']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['cumulative-layout-shift']?.score > 0.9 ? 'Good' : audits['cumulative-layout-shift']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['cumulative-layout-shift']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Visual stability measure</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Speed Index</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['speed-index']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['speed-index']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['speed-index']?.score > 0.9 ? 'Good' : audits['speed-index']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['speed-index']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Visual loading speed</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Total Blocking Time</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['total-blocking-time']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['total-blocking-time']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['total-blocking-time']?.score > 0.9 ? 'Good' : audits['total-blocking-time']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['total-blocking-time']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Time blocked by long tasks</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Time to Interactive</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['interactive']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['interactive']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['interactive']?.score > 0.9 ? 'Good' : audits['interactive']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['interactive']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Time until page is interactive</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">First Input Delay</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                audits['max-potential-fid']?.score > 0.9 ? 'bg-green-100 text-green-800' : 
                audits['max-potential-fid']?.score > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {audits['max-potential-fid']?.score > 0.9 ? 'Good' : audits['max-potential-fid']?.score > 0.5 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{audits['max-potential-fid']?.displayValue || 'N/A'}</p>
            <p className="text-xs text-gray-500">Input responsiveness</p>
          </div>
        </div>
      </div>

      {/* Basic Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{responseTime}ms</div>
          <div className="text-sm text-gray-600">Response Time</div>
          <div className={`text-xs mt-1 ${
            responseTime < 1000 ? 'text-green-600' : responseTime < 2000 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {responseTime < 1000 ? 'Excellent' : responseTime < 2000 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{(contentLength / 1024).toFixed(1)}KB</div>
          <div className="text-sm text-gray-600">Page Size</div>
          <div className={`text-xs mt-1 ${
            contentLength < 100000 ? 'text-green-600' : contentLength < 500000 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {contentLength < 100000 ? 'Excellent' : contentLength < 500000 ? 'Good' : 'Large'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{imageCount}</div>
          <div className="text-sm text-gray-600">Images</div>
          <div className={`text-xs mt-1 ${
            imageCount < 10 ? 'text-green-600' : imageCount < 20 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {imageCount < 10 ? 'Good' : imageCount < 20 ? 'Moderate' : 'Many'}
          </div>
        </div>
      </div>

      {/* Image Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Image Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Images</span>
                <span className="text-sm font-medium text-blue-600">{imageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Large Images (&gt;100KB)</span>
                <span className={`text-sm font-medium ${
                  largeImages.length === 0 ? 'text-green-600' : largeImages.length < imageCount * 0.3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {largeImages.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Image Size</span>
                <span className="text-sm font-medium text-blue-600">
                  {(totalImageSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Image Size</span>
                <span className="text-sm font-medium text-blue-600">
                  {imageCount > 0 ? (totalImageSize / imageCount / 1024).toFixed(1) : 0} KB
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Optimization Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lazy Loading</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasLazyLoading ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasLazyLoading ? 'Enabled' : 'Not Enabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Modern Formats</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasModernFormats ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasModernFormats ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compressed Images</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasCompressedImages ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasCompressedImages ? 'Present' : 'Not Found'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Optimization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Scripts & Styles</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Async Scripts</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasAsyncScripts ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasAsyncScripts ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minified CSS</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasMinifiedCSS ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasMinifiedCSS ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minified JS</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasMinifiedJS ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasMinifiedJS ? 'Present' : 'Not Found'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Delivery & Compression</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CDN Usage</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasCDN ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasCDN ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gzip Compression</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasGzip ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasGzip ? 'Enabled' : 'Not Enabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          {responseTime > 2000 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Improve Response Time</h4>
              <p className="text-sm text-red-800">
                Your response time is {responseTime}ms. Consider optimizing server performance, using a CDN, or reducing server-side processing.
              </p>
            </div>
          )}
          {largeImages.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Optimize Large Images</h4>
              <p className="text-sm text-yellow-800">
                {largeImages.length} images are larger than 100KB. Consider compressing them or using modern formats like WebP.
              </p>
            </div>
          )}
          {!hasLazyLoading && imageCount > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Enable Lazy Loading</h4>
              <p className="text-sm text-yellow-800">
                Enable lazy loading for images to improve initial page load time.
              </p>
            </div>
          )}
          {!hasModernFormats && imageCount > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Use Modern Image Formats</h4>
              <p className="text-sm text-blue-800">
                Consider using WebP or AVIF formats for better compression and faster loading.
              </p>
            </div>
          )}
          {!hasAsyncScripts && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Use Async Scripts</h4>
              <p className="text-sm text-yellow-800">
                Load JavaScript asynchronously to prevent blocking page rendering.
              </p>
            </div>
          )}
          {!hasGzip && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Enable Gzip Compression</h4>
              <p className="text-sm text-yellow-800">
                Enable gzip compression to reduce file sizes and improve loading speed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}