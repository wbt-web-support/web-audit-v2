'use client'

import { useEffect, use, useState } from 'react'
import { GeminiAnalysisResult } from '@/lib/gemini'

interface PageAnalysisPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PageAnalysisPage({ params }: PageAnalysisPageProps) {
  // Unwrap the params Promise
  const resolvedParams = use(params)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const performAnalysis = async () => {
      try {
        setIsAnalyzing(true)
        setError(null)

        // First, check if analysis already exists
        const checkResponse = await fetch(`/api/gemini-analysis?pageId=${resolvedParams.id}`)
        const checkData = await checkResponse.json()

        if (checkData.success && checkData.analysis) {
          // Analysis already exists, use cached data
          setAnalysisResult(checkData.analysis)
          setIsAnalyzing(false)
          return
        }

        // If no cached analysis, get page data and start analysis automatically
        console.log('No cached analysis found, starting automatic analysis...')
        
        // Get page data to extract content
        const pageResponse = await fetch(`/api/scrape-single?pageId=${resolvedParams.id}`)
        const pageData = await pageResponse.json()
        
        if (!pageData.success || !pageData.page) {
          throw new Error('Failed to fetch page data')
        }

        const page = pageData.page
        
        // Filter HTML content to get text content
        const { filterHtmlContent } = await import('@/lib/html-content-filter')
        const filteredContent = page.filtered_content || filterHtmlContent(page.html_content || '')
        const textContent = typeof filteredContent === 'string' ? filteredContent : filteredContent.pureContent

        if (!textContent || textContent.trim().length === 0) {
          throw new Error('No content available for analysis')
        }

        // Start Gemini analysis
        const analysisResponse = await fetch('/api/gemini-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageId: resolvedParams.id,
            content: textContent,
            url: page.url
          })
        })

        const analysisData = await analysisResponse.json()

        if (analysisData.success) {
          setAnalysisResult(analysisData.analysis)
        } else {
          throw new Error(analysisData.error || 'Analysis failed')
        }
      } catch (err) {
        console.error('Error during analysis:', err)
        setError('Failed to perform analysis. Please try again.')
      } finally {
        setIsAnalyzing(false)
      }
    }

    performAnalysis()
  }, [resolvedParams.id])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing content with AI...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Content Analysis Results</h1>
            
            {/* Overall Score */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Overall Score</h3>
                <p className="text-2xl font-bold text-blue-900">{analysisResult.overall_score}/100</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Grammar</h3>
                <p className="text-2xl font-bold text-green-900">{analysisResult.grammar_score}/100</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Consistency</h3>
                <p className="text-2xl font-bold text-purple-900">{analysisResult.consistency_score}/100</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-600">Readability</h3>
                <p className="text-2xl font-bold text-orange-900">{analysisResult.readability_score}/100</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
              <p className="text-gray-700">{analysisResult.summary}</p>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Word Count</h3>
                <p className="text-xl font-bold text-gray-900">{analysisResult.word_count}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Sentence Count</h3>
                <p className="text-xl font-bold text-gray-900">{analysisResult.sentence_count}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Reading Level</h3>
                <p className="text-xl font-bold text-gray-900 capitalize">{analysisResult.reading_level}</p>
              </div>
            </div>

            {/* Issues and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Issues Found</h2>
                <div className="space-y-3">
                  {analysisResult.grammar_issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-red-800"><strong>{issue.type}:</strong> {issue.text}</p>
                      <p className="text-xs text-red-600 mt-1">Suggestion: {issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h2>
                <div className="space-y-2">
                  {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading page analysis...</p>
      </div>
    </div>
  )
}
