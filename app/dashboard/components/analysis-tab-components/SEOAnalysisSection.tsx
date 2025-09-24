'use client'

import { SEOAnalysisResult } from '@/types/audit'
import { analyzeSEO } from '@/lib/seo-analysis'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'

interface SEOAnalysisSectionProps {
  project: {
    id: string
    site_url: string
    scraping_data?: any
    seo_analysis?: SEOAnalysisResult | null
  }
  scrapedPages?: any[]
}

export default function SEOAnalysisSection({ project, scrapedPages = [] }: SEOAnalysisSectionProps) {
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysisResult | null>(project.seo_analysis || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updateAuditProject } = useSupabase()

  useEffect(() => {
    // Update local state when project SEO analysis changes
    if (project.seo_analysis) {
      setSeoAnalysis(project.seo_analysis)
    }
  }, [project.seo_analysis])

  useEffect(() => {
    // Only run local analysis if we have scraped pages and no existing analysis
    if (scrapedPages.length > 0 && !project.seo_analysis) {
      analyzePage()
    }
  }, [scrapedPages, project.seo_analysis])

  const analyzePage = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the first page's HTML content from scraped pages
      const firstPage = scrapedPages.find(page => page.audit_project_id === project.id)
      if (firstPage?.html_content) {
        const analysis = analyzeSEO(firstPage.html_content, project.site_url)
        setSeoAnalysis(analysis)
        
        // Store the analysis in the database
        
        const { error: updateError } = await updateAuditProject(project.id, {
          seo_analysis: analysis
        })
        
        if (updateError) {
          console.error('❌ Failed to store SEO analysis:', updateError)
          setError('Analysis completed but failed to save to database')
        } else {
          
        }
      } else {
        setError('No HTML content available for analysis')
      }
    } catch (err) {
      setError('Failed to analyze SEO content')
      console.error('SEO Analysis Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📝'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analysis</h3>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!seoAnalysis) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analysis</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600">No data available for SEO analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
        <button
          onClick={analyzePage}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          Re-analyze
        </button>
      </div>

      {/* SEO Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">SEO Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(seoAnalysis.score)}`}>
            {seoAnalysis.score}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(seoAnalysis.score)}`}
            style={{ width: `${seoAnalysis.score}%` }}
          ></div>
        </div>
      </div>

      {/* Issues and Fixes in Column Layout */}
      {seoAnalysis.issues.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Issues & Fixes</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {seoAnalysis.issues.map((issue, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getIssueIcon(issue.type)}</span>
                    <h5 className="font-medium text-gray-900">{issue.title}</h5>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(issue.impact)}`}
                  >
                    {issue.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Fix:</span> {issue.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {seoAnalysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {seoAnalysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">💡</span>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {seoAnalysis.issues.length === 0 && (
        <div className="text-center py-8">
          <div className="text-green-500 text-4xl mb-2">✅</div>
          <p className="text-gray-600">Great! No SEO issues found.</p>
        </div>
      )}
    </div>
  )
}
