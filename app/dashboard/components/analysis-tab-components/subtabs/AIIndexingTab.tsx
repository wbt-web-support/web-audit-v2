'use client'

import { useState, useMemo } from 'react'
import { AuditProject } from '@/types/audit'
import { useUserPlan } from '@/hooks/useUserPlan'
import { useAuth } from '@/hooks/useAuth'
import SkeletonLoader from '@/app/dashboard/components/SkeletonLoader'

interface AIIndexingTabProps {
  project: AuditProject
}

interface Competitor {
  name: string
  rank: number
  url?: string
}

interface KeywordRankingResult {
  keyword: string
  rank: number | null
  position: string | null
  analysis: string
  suggestions: string[]
  strengths: string[]
  improvements: string[]
  competitors: Competitor[]
  timestamp: string
}

export default function AIIndexingTab({ project }: AIIndexingTabProps) {
  const [keywords, setKeywords] = useState<string[]>([''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<KeywordRankingResult[]>([])
  const [accessDenied, setAccessDenied] = useState(false)
  const { user } = useAuth()
  const { hasFeature, loading: planLoading, planInfo, refreshPlan } = useUserPlan()

  // First: Check if user's plan includes this feature
  // This is the primary check - if plan doesn't have feature, show upgrade card immediately
  const userHasFeature = useMemo(() => {
    if (planLoading) {
      return null // Still loading, return null to show skeleton
    }
    
    // Direct check using useUserPlan hook
    const hasAccess = hasFeature('ai_keyword_ranking')
    
    // Also check planInfo directly for extra validation
    const planHasFeature = planInfo?.can_use_features?.includes('ai_keyword_ranking') || false
    
    // Return true only if both checks pass
    return hasAccess && planHasFeature
  }, [hasFeature, planInfo?.can_use_features, planLoading])


  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords]
    newKeywords[index] = value
    setKeywords(newKeywords)
  }

  const addKeywordField = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, ''])
    }
  }

  const removeKeywordField = (index: number) => {
    if (keywords.length > 1) {
      const newKeywords = keywords.filter((_, i) => i !== index)
      setKeywords(newKeywords)
    }
  }

  const handleSearch = async () => {
    const validKeywords = keywords.filter(k => k.trim() !== '')
    
    if (validKeywords.length === 0) {
      setError('Please enter at least one keyword')
      return
    }

    if (validKeywords.length > 10) {
      setError('Maximum 10 keywords allowed')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/keyword-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: validKeywords,
          websiteUrl: project.site_url,
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle access denied error specifically
        if (response.status === 403 || errorData.error === 'Access denied') {
          console.error('[AIIndexingTab] Access denied from server:', {
            status: response.status,
            errorData,
            userId: user?.id
          })
          
          // Set access denied state to show upgrade card
          setAccessDenied(true)
          setError(null)
          setIsLoading(false)
          
          // Refresh plan to get latest data
          await refreshPlan()
          
          return
        }
        
        throw new Error(errorData.error || 'Failed to analyze keyword rankings')
      }

      const data = await response.json()
      if (data.success && data.results) {
        setResults(data.results)
      } else {
        throw new Error(data.error || 'Failed to get ranking results')
      }
    } catch (err) {
      console.error('Error analyzing keyword rankings:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze keyword rankings')
    } finally {
      setIsLoading(false)
    }
  }

  // FIRST CHECK: Show skeleton while plan is loading
  if (planLoading || userHasFeature === null) {
    return <SkeletonLoader type="performance" />
  }

  // SECOND CHECK: Show upgrade card immediately if user's plan doesn't include this feature
  // This prevents users from even seeing the form if they don't have access
  if (userHasFeature === false || accessDenied) {
    return (
      <div className="bg-white border border-black rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="text-[#FF4A00]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black mb-1">AI Keyword Ranking Analysis</h3>
            <p className="text-sm text-black mb-3">
              This feature is not available in your current plan. Upgrade to access AI-powered keyword ranking analysis, competitor insights, and actionable SEO recommendations.
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-black">
                Current plan: <span className="font-medium text-[#FF4A00]">{planInfo?.plan_name || planInfo?.plan_type || 'Free'}</span>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard?tab=profile&subtab=plans'}
                className="px-4 py-2 bg-[#FF4A00] text-white rounded-lg hover:bg-[#e64401] transition-colors text-sm font-medium"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-black mb-2">AI Keyword Ranking Analysis</h3>
          <p className="text-sm text-black mb-1">
            Analyze your website&apos;s search engine ranking position for specific keywords using advanced AI technology.
          </p>
          <p className="text-xs text-black">
            Enter up to 10 keywords to get detailed ranking analysis, actionable feedback, and improvement suggestions.
          </p>
        </div>

        {/* Keywords Input */}
        <div className="space-y-3 mb-6">
          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(index, e.target.value)}
                placeholder={`Keyword ${index + 1}`}
                className="flex-1 px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4A00] focus:border-transparent text-black bg-white"
                disabled={isLoading}
              />
              {keywords.length > 1 && (
                <button
                  onClick={() => removeKeywordField(index)}
                  disabled={isLoading}
                  className="px-3 py-2 text-white bg-[#FF4A00] rounded-lg hover:bg-[#e64401] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {keywords.length < 10 && (
          <button
            onClick={addKeywordField}
            disabled={isLoading}
            className="mb-6 px-4 py-2 text-[#FF4A00] border border-[#FF4A00] rounded-lg hover:bg-[#FF4A00] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Keyword
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isLoading || keywords.filter(k => k.trim() !== '').length === 0}
          className="w-full px-6 py-3 text-white bg-[#FF4A00] rounded-lg hover:bg-[#e64401] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Analyzing...' : 'Search Rankings'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-black rounded-lg p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4A00]"></div>
            <div>
              <p className="text-sm font-medium text-black">Analyzing keyword rankings</p>
              <p className="text-xs text-black mt-1">We use Gemini AI to analyze your website&apos;s search engine rankings</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white border border-black rounded-lg p-4">
          <p className="text-sm text-black">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-black">Ranking Analysis Results</h4>
            <span className="text-xs text-black">Analyzed {results.length} {results.length === 1 ? 'keyword' : 'keywords'}</span>
          </div>
          
          {results.map((result, index) => (
            <div key={index} className="bg-white border-2 border-black rounded-lg p-6 space-y-5">
              {/* Header Section */}
              <div className="pb-4 border-b-2 border-black">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="text-lg font-bold text-black">{result.keyword}</h5>
                  {result.rank !== null ? (
                    <div className="text-right">
                      <div className="text-xs text-black mb-1">Current Rank</div>
                      <div className="text-2xl font-bold text-[#FF4A00]">{result.rank}</div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-xs text-black mb-1">Status</div>
                      <div className="text-sm font-bold text-black">Not Ranking</div>
                    </div>
                  )}
                </div>
                {result.position && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-black">Position: </span>
                    <span className="text-sm text-black">{result.position}</span>
                  </div>
                )}
              </div>

              {/* Analysis Section */}
              {result.analysis && (
                <div>
                  <h6 className="text-base font-bold text-black mb-3">Detailed Analysis</h6>
                  <div className="bg-white border border-black rounded-lg p-4">
                    <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
                  </div>
                </div>
              )}

              {/* Strengths Section */}
              {result.strengths && result.strengths.length > 0 && (
                <div>
                  <h6 className="text-base font-bold text-black mb-3">Current Strengths</h6>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-[#FF4A00] mr-2 font-bold">•</span>
                        <span className="text-sm text-black flex-1">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions Section */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div>
                  <h6 className="text-base font-bold text-black mb-3">Actionable Suggestions</h6>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-[#FF4A00] mr-2 font-bold">•</span>
                        <span className="text-sm text-black flex-1">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements Section */}
              {result.improvements && result.improvements.length > 0 && (
                <div>
                  <h6 className="text-base font-bold text-black mb-3">Key Improvements Needed</h6>
                  <ul className="space-y-2">
                    {result.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-[#FF4A00] mr-2 font-bold">•</span>
                        <span className="text-sm text-black flex-1">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Competitors Section */}
              {result.competitors && result.competitors.length > 0 && (
                <div>
                  <h6 className="text-base font-bold text-black mb-3">Top Competitors</h6>
                  <div className="space-y-2">
                    {result.competitors.map((competitor, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-black rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-[#FF4A00] w-6 text-center">{idx + 1}</span>
                          <div>
                            <span className="text-sm font-medium text-black">{competitor.name}</span>
                            {competitor.url && (
                              <p className="text-xs text-black mt-0.5">{competitor.url}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-black">Rank</span>
                          <div className="text-sm font-bold text-[#FF4A00]">{competitor.rank}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

