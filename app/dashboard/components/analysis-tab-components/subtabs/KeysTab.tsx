'use client'

import { useState, useEffect } from 'react'
import { AuditProject } from '@/types/audit'
import { detectKeysInPages, DetectedKey, KeyDetectionResult } from '@/lib/key-detection'

interface KeysTabProps {
  project: AuditProject
}

export default function KeysTab({ project }: KeysTabProps) {
  const [detectedKeys, setDetectedKeys] = useState<DetectedKey[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<KeyDetectionResult | null>(null)

  // Analyze keys when component mounts or project data changes
  useEffect(() => {
    const analyzeKeys = async () => {
      if (!project || !project.all_pages_html || project.all_pages_html.length === 0) {
        setAnalysisComplete(true)
        return
      }

      setIsAnalyzing(true)
      setError(null)
      setAnalysisComplete(false)

      try {
        console.log('🔍 Starting key analysis for project:', project.id)
        console.log('📊 Pages to analyze:', project.all_pages_html.length)

        // Normalize the data format to support both project and page-specific formats
        const normalizedPages = project.all_pages_html.map((page: any, index: number) => {
          // If page already has the expected format (pageName, pageUrl, pageHtml)
          if (page.pageName && page.pageUrl && page.pageHtml) {
            return page
          }
          
          // If page has pageUrl and pageHtml (new format)
          if (page.pageUrl && page.pageHtml) {
            return {
              pageName: `Page ${index + 1}`,
              pageUrl: page.pageUrl,
              pageHtml: page.pageHtml
            }
          }
          
          // If page is a full page object with html_content
          if (page.html_content) {
            return {
              pageName: page.title || page.page_title || `Page ${index + 1}`,
              pageUrl: page.url || page.page_url || 'Unknown URL',
              pageHtml: page.html_content
            }
          }
          
          // Fallback for any other format
          return {
            pageName: `Page ${index + 1}`,
            pageUrl: 'Unknown URL',
            pageHtml: ''
          }
        })

        const result = await detectKeysInPages(normalizedPages)
        
        setDetectedKeys(result.allKeys)
        setAnalysisResult(result.summary)
        setAnalysisComplete(true)
        
        console.log('✅ Key analysis completed:', {
          totalKeys: result.summary.totalKeys,
          exposedKeys: result.summary.exposedKeys,
          criticalKeys: result.summary.criticalKeys
        })
      } catch (err) {
        console.error('❌ Key analysis failed:', err)
        setError('Failed to analyze keys. Please try again.')
        setAnalysisComplete(true)
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzeKeys()
       }, [project?.id, project?.all_pages_html, project])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exposed':
        return 'bg-red-100 text-red-800'
      case 'secure':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Keys Analysis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This analysis checks for exposed API keys, secrets, and sensitive credentials in your website.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Analyzing website for security keys...</span>
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Analysis Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisComplete && !isAnalyzing && !error && (
        <>
          {analysisResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Analysis Summary</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Found {analysisResult.totalKeys} keys across {project.all_pages_html?.length || 0} pages
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-red-600 font-medium">
                    {analysisResult.exposedKeys} Exposed
                  </span>
                  <span className="text-green-600 font-medium">
                    {analysisResult.secureKeys} Secure
                  </span>
                  <span className="text-orange-600 font-medium">
                    {analysisResult.criticalKeys} Critical
                  </span>
                </div>
              </div>
            </div>
          )}

          {detectedKeys.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-700">Detected Keys ({detectedKeys.length})</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="text-sm font-medium text-red-600">
                {detectedKeys.filter(key => key.status === 'exposed').length} Exposed
              </span>
              <span className="text-sm font-medium text-green-600">
                {detectedKeys.filter(key => key.status === 'secure').length} Secure
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {detectedKeys.map((key, index) => (
              <div key={key.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-gray-900">{key.type}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(key.severity)}`}>
                        {key.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(key.status)}`}>
                        {key.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round((key.confidence || 0) * 100)}% confidence
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Key:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {key.key}
                        </code>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Location:</span>
                        <span className="text-sm text-gray-700">{key.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Description:</span>
                        <span className="text-sm text-gray-700">{key.description}</span>
                      </div>

                      {key.context && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">Context:</span>
                          <div className="text-xs bg-gray-50 p-2 rounded mt-1 font-mono text-gray-600">
                            {key.context}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {key.status === 'exposed' && (
                    <div className="ml-4">
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-gray-600">No keys detected</p>
          <p className="text-sm text-gray-500 mt-1">Your website appears to be secure</p>
        </div>
      )}
        </>
      )}
    </div>
  )
}
