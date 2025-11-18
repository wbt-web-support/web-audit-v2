'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { AuditProject } from '@/types/audit'
import { formatPageSpeedScore, getScoreColor, getScoreBgColor } from '@/lib/pagespeed'
import { useSupabase } from '@/contexts/SupabaseContext'

interface PerformanceSectionProps {
  project: AuditProject
  onDataUpdate?: (updatedProject: AuditProject) => void
}

export default function PerformanceSection({ project, onDataUpdate }: PerformanceSectionProps) {
  const { updateAuditProject } = useSupabase()
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false)
  
  const pagespeedData = project.pagespeed_insights_data

  // Reanalyze function
  const handleReanalyze = useCallback(async () => {
    try {
      setIsReanalyzing(true)
      setIsLoading(true)
      setError(null)
      
      // Update project with loading state
      await updateAuditProject(project.id, {
        pagespeed_insights_loading: true,
        pagespeed_insights_data: null
      })

      // Call PageSpeed API
      const response = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: project.id,
          url: project.site_url 
        })
      })

      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        // Update project with new data
        const updatedProject = {
          ...project,
          pagespeed_insights_data: result.analysis,
          pagespeed_insights_loading: false
        }
        
        const { error: updateError } = await updateAuditProject(project.id, { 
          pagespeed_insights_data: result.analysis,
          pagespeed_insights_loading: false
        })
        
        if (updateError) {
          console.error('Failed to update project with performance data:', updateError)
          // Still update the UI even if database update fails
          if (onDataUpdate) {
            onDataUpdate(updatedProject)
          }
        } else {
          if (onDataUpdate) {
            onDataUpdate(updatedProject)
          }
        }
      } else {
        setError(result.error || 'PageSpeed analysis failed')
      }
    } catch (err) {
      console.error('PageSpeed analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to perform PageSpeed analysis')
    } finally {
      setIsReanalyzing(false)
      setIsLoading(false)
    }
  }, [project, updateAuditProject, onDataUpdate])

  // Auto-load performance analysis when component mounts if no data exists
  useEffect(() => {
    if (!pagespeedData && !hasAutoLoaded && !isLoading && !isReanalyzing && project.site_url) {
      setHasAutoLoaded(true)
      handleReanalyze()
    }
  }, [pagespeedData, hasAutoLoaded, isLoading, isReanalyzing, project.site_url, handleReanalyze])

  // Force auto-load on mount if no data exists
  useEffect(() => {
    if (!pagespeedData && project.site_url && !isLoading && !isReanalyzing) {
      handleReanalyze()
    }
  }, [handleReanalyze, pagespeedData, project.site_url, isLoading, isReanalyzing])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ff4b01]"></div>
              <span className="text-sm text-gray-600">Analyzing performance...</span>
            </div>
          </div>
          
          {/* Enhanced loading message */}
          <div className="bg-[#ff4b01]/10 border border-[#ff4b01]/30 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#ff4b01]/70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[#ff4b01]">Performance Analysis in Progress</h3>
                <div className="mt-2 text-sm text-[#ff4b01]">
                  <p>We&apos;re running comprehensive performance tests on your website. This typically takes 30-60 seconds to complete.</p>
                  <p className="mt-1 text-xs text-[#ff4b01]/80">Please don&apos;t close this page while the analysis is running.</p>
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
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="inline-flex items-center px-3 py-2 border border-red-300  text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReanalyzing ? (
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

  // No data state
  if (!pagespeedData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
            <span className="text-sm text-gray-500">No data available</span>
          </div>
          
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data</h3>
            <p className="mt-1 text-sm text-gray-500">Performance analysis has not been completed yet.</p>
            <div className="mt-4">
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#ff4b01] hover:bg-[#e64401] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff4b01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReanalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Data display
  const { lighthouseResult, loadingExperience } = pagespeedData
  const { categories, audits, fullPageScreenshot, screenshots } = lighthouseResult

  // Chart component for scores
  const ScoreChart = ({ score, title, color, size = "w-24 h-24" }: { 
    score: number, 
    title: string, 
    color: string, 
    size?: string 
  }) => {
    const percentage = Math.round(score * 100)
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
    // Use hex color directly or className for Tailwind classes
    const isHexColor = color.startsWith('#')
    const strokeClassName = isHexColor ? '' : color
    
    return (
      <div className="flex flex-col items-center">
        <div className={`relative ${size}`}>
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
              stroke={isHexColor ? color : "currentColor"}
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className={strokeClassName}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{percentage}</span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mt-2 text-center">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
          {formatPageSpeedScore(score)}
        </span>
      </div>
    )
  }

  // Metric card component
  const MetricCard = ({ 
    title, 
    value, 
    score, 
    description 
  }: { 
    title: string, 
    value: string, 
    score: number, 
    description?: string 
  }) => {
    const hasValue = value && value !== 'N/A'
    
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <span className={`text-xs px-2 py-1 rounded-full ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
            {formatPageSpeedScore(score)}
          </span>
        </div>
        {hasValue && (
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        )}
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              Desktop Analysis • {new Date(lighthouseResult.fetchTime).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Scores Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Overall Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ScoreChart 
            score={categories.performance.score} 
            title="Performance" 
            color="#FF4A00"
            size="w-20 h-20"
          />
          <ScoreChart 
            score={categories.accessibility.score} 
            title="Accessibility" 
            color="#FF4A00"
            size="w-20 h-20"
          />
          <ScoreChart 
            score={categories['best-practices'].score} 
            title="Best Practices" 
            color="#FF4A00"
            size="w-20 h-20"
          />
          <ScoreChart 
            score={categories.seo.score} 
            title="SEO" 
            color="#FF4A00"
            size="w-20 h-20"
          />
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="First Contentful Paint"
            value={audits['first-contentful-paint']?.displayValue || 'N/A'}
            score={audits['first-contentful-paint']?.score || 0}
            description="Time to first content render"
          />
          <MetricCard
            title="Largest Contentful Paint"
            value={audits['largest-contentful-paint']?.displayValue || 'N/A'}
            score={audits['largest-contentful-paint']?.score || 0}
            description="Time to largest content render"
          />
          <MetricCard
            title="Cumulative Layout Shift"
            value={audits['cumulative-layout-shift']?.displayValue || 'N/A'}
            score={audits['cumulative-layout-shift']?.score || 0}
            description="Visual stability measure"
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Speed Index"
            value={audits['speed-index']?.displayValue || 'N/A'}
            score={audits['speed-index']?.score || 0}
            description="Visual loading speed"
          />
          <MetricCard
            title="Total Blocking Time"
            value={audits['total-blocking-time']?.displayValue || 'N/A'}
            score={audits['total-blocking-time']?.score || 0}
            description="Time blocked by long tasks"
          />
          <MetricCard
            title="Time to Interactive"
            value={audits['interactive']?.displayValue || 'N/A'}
            score={audits['interactive']?.score || 0}
            description="Time until page is interactive"
          />
          <MetricCard
            title="First Input Delay"
            value={audits['max-potential-fid']?.displayValue || 'N/A'}
            score={audits['max-potential-fid']?.score || 0}
            description="Input responsiveness"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Server Response Time"
            value={audits['server-response-time']?.displayValue || 'N/A'}
            score={audits['server-response-time']?.score || 0}
            description="Time for server to respond"
          />
          <MetricCard
            title="Total Resource Size"
            value={audits['total-byte-weight']?.displayValue || 'N/A'}
            score={audits['total-byte-weight']?.score || 0}
            description="Total bytes downloaded"
          />
          <MetricCard
            title="DOM Size"
            value={audits['dom-size']?.displayValue || 'N/A'}
            score={audits['dom-size']?.score || 0}
            description="Number of DOM elements"
          />
        </div>
      </div>

      {/* Webpage Screenshots */}
      {(fullPageScreenshot || screenshots) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Webpage Screenshots</h3>
          <div className="space-y-6">
            {fullPageScreenshot && fullPageScreenshot.data && fullPageScreenshot.mime_type && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Full Page Screenshot</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden ">
                  <Image
                    src={`data:${fullPageScreenshot.mime_type};base64,${fullPageScreenshot.data}`}
                    alt="Full page screenshot"
                    width={fullPageScreenshot.width || 800}
                    height={fullPageScreenshot.height || 600}
                    className="w-full h-auto"
                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Dimensions: {fullPageScreenshot.width || 'Unknown'} × {fullPageScreenshot.height || 'Unknown'}px
                </p>
              </div>
            )}
            
            {screenshots && screenshots.data && screenshots.mime_type && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Viewport Screenshot</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden ">
                  <Image
                    src={`data:${screenshots.mime_type};base64,${screenshots.data}`}
                    alt="Page screenshot"
                    width={screenshots.width || 800}
                    height={screenshots.height || 600}
                    className="w-full h-auto"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Dimensions: {screenshots.width || 'Unknown'} × {screenshots.height || 'Unknown'}px
                </p>
              </div>
            )}
            
            {/* Show message if screenshots exist but data is invalid */}
            {((fullPageScreenshot && (!fullPageScreenshot.data || !fullPageScreenshot.mime_type)) ||
              (screenshots && (!screenshots.data || !screenshots.mime_type))) && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Screenshot data is not available</p>
                <p className="text-sm text-gray-500 mt-1">The PageSpeed API did not return valid screenshot data</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real User Experience */}
      {loadingExperience && loadingExperience.metrics && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Real User Experience</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(loadingExperience.metrics).map(([key, metric]) => {
              const metricData = metric as { percentile?: number; category?: string }
              const hasValue = metricData.percentile !== undefined && metricData.percentile !== null
              return (
                <MetricCard
                  key={key}
                  title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={hasValue ? `${metricData.percentile}ms` : 'N/A'}
                  score={metricData.category === 'FAST' ? 0.9 : metricData.category === 'AVERAGE' ? 0.7 : 0.4}
                  description={`Real user data - ${metricData.category}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Test Configuration</h4>
            <div className="space-y-3">
              {lighthouseResult.configSettings.formFactor && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Form Factor:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{lighthouseResult.configSettings.formFactor}</span>
                </div>
              )}
              {lighthouseResult.configSettings.locale && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Locale:</span>
                  <span className="text-sm font-medium text-gray-900">{lighthouseResult.configSettings.locale}</span>
                </div>
              )}
              {lighthouseResult.userAgent && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">User Agent:</span>
                  <span className="text-xs font-medium text-gray-900 truncate max-w-48" title={lighthouseResult.userAgent}>
                    {lighthouseResult.userAgent}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Analysis Information</h4>
            <div className="space-y-3">
              {lighthouseResult.finalUrl && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Final URL:</span>
                  <span className="text-xs font-medium text-gray-900 truncate max-w-48" title={lighthouseResult.finalUrl}>
                    {lighthouseResult.finalUrl}
                  </span>
                </div>
              )}
              {pagespeedData.version && pagespeedData.version.major !== undefined && pagespeedData.version.minor !== undefined && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="text-sm font-medium text-gray-900">{pagespeedData.version.major}.{pagespeedData.version.minor}</span>
                </div>
              )}
              {lighthouseResult.runWarnings && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Warnings:</span>
                  <span className={`text-sm font-medium ${lighthouseResult.runWarnings.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {lighthouseResult.runWarnings.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
