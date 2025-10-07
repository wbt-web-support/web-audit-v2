'use client'

import { useState, useEffect } from 'react'
import { AuditProject } from '@/types/audit'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import FeatureUnavailableCard from '../FeatureUnavailableCard'

interface AnalysisHeaderProps {
  project: AuditProject
  activeSection: string
  onSectionChange: (section: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  customTabs?: Array<{ id: string; name: string; icon: string }>
  pageTitle?: string
  showUnavailableContent?: boolean // New prop to control showing unavailable content
}

export default function AnalysisHeader({ project, activeSection, onSectionChange, onRefresh, isRefreshing, customTabs, pageTitle, showUnavailableContent = false }: AnalysisHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const { user } = useAuth()
  const { planInfo, loading: isLoadingPlan, hasFeature } = useUserPlan()

  // Map tab IDs to feature IDs
  const getFeatureIdForTab = (tabId: string): string | null => {
    const featureMap: Record<string, string> = {
      // Main analysis page tabs
      'overview': 'single_page_crawl', // Basic overview is available to all
      'pages': 'full_site_crawl',
      'technologies': 'technical_analysis', // Updated to use technical_analysis
      'cms': 'brand_consistency_check',
      'performance': 'performance_metrics',
      'seo': 'seo_structure',
      'images': 'image_scan',
      'links': 'link_scanner',
      
      // Page analysis tabs
      'grammar-content': 'grammar_content_analysis',
      'seo-structure': 'seo_structure',
      'ui-quality': 'ui_ux_quality_check',
      'technical': 'technical_analysis',
      'accessibility': 'accessibility_audit'
    }
    return featureMap[tabId] || null
  }

  // Check if user has access to a specific tab
  const hasAccessToTab = (tabId: string): boolean => {
    if (!planInfo) return true // Show all tabs if plan not loaded yet
    const featureId = getFeatureIdForTab(tabId)
    if (!featureId) return true // Show tabs that don't require specific features
    return hasFeature(featureId)
  }

  // Get tab information for unavailable cards
  const getTabInfo = (tabId: string) => {
    const tabInfoMap: Record<string, { title: string; description: string }> = {
      'overview': {
        title: 'Overview Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive website overview and insights.'
      },
      'pages': {
        title: 'Full Site Crawl',
        description: 'This feature is not available in your current plan. Upgrade to access full website crawling and analysis.'
      },
      'technologies': {
        title: 'Technical Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access detailed technical analysis and recommendations.'
      },
      'cms': {
        title: 'CMS Detection',
        description: 'This feature is not available in your current plan. Upgrade to access CMS detection and brand consistency checks.'
      },
      'performance': {
        title: 'Performance Metrics',
        description: 'This feature is not available in your current plan. Upgrade to access detailed performance analysis and PageSpeed Insights.'
      },
      'seo': {
        title: 'SEO & Structure Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive SEO analysis and structure validation.'
      },
      'images': {
        title: 'Image Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access image optimization analysis and recommendations.'
      },
      'links': {
        title: 'Link Scanner',
        description: 'This feature is not available in your current plan. Upgrade to access link validation and broken link detection.'
      },
      'grammar-content': {
        title: 'Grammar & Content Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access AI-powered grammar and content analysis.'
      },
      'seo-structure': {
        title: 'SEO & Structure Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive SEO structure analysis.'
      },
      'ui-quality': {
        title: 'UI/UX Quality Check',
        description: 'This feature is not available in your current plan. Upgrade to access UI/UX quality analysis and recommendations.'
      },
      'technical': {
        title: 'Technical Analysis',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive technical audit and recommendations.'
      },
      'accessibility': {
        title: 'Accessibility Audit',
        description: 'This feature is not available in your current plan. Upgrade to access comprehensive accessibility compliance checking.'
      }
    }
    return tabInfoMap[tabId] || {
      title: 'Feature Unavailable',
      description: 'This feature is not available in your current plan. Upgrade to access this functionality.'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      case 'pending': return 'Pending'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  const getProjectName = (siteUrl: string) => {
    try {
      const url = new URL(siteUrl)
      return url.hostname.replace('www.', '')
    } catch {
      return siteUrl
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col space-y-3">
          {currentTab === 'page-analysis' && (
            <button
              onClick={() => router.push(`/dashboard?tab=analysis&projectId=${project.id}`)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-fit"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pageTitle || getProjectName(project.site_url)} 
            </h1>
            <p className="text-gray-600">{project.site_url}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          )}
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {getStatusDisplayName(project.status)}
          </span>
          <div className="text-right">
            <div className={`text-2xl font-bold ${project.score >= 80 ? 'text-green-600' : project.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {project.score > 0 ? project.score : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">/100</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        {isLoadingPlan ? (
          <div className="py-4">
            <div className="flex space-x-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <nav className="-mb-px flex space-x-8">
            {(customTabs || [
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'pages', name: 'Pages', icon: '📄' },
              { id: 'technologies', name: 'Technical', icon: '⚙️' },
              { id: 'cms', name: 'CMS', icon: '🏗️' },
              { id: 'performance', name: 'Performance', icon: '⚡' },
              { id: 'seo', name: 'SEO', icon: '🔍' },
              { id: 'images', name: 'Images', icon: '🖼️' },
              { id: 'links', name: 'Links', icon: '🔗' }
            ])
            .map((tab) => {
              const hasAccess = hasAccessToTab(tab.id)
              const featureId = getFeatureIdForTab(tab.id)
              const isPremiumFeature = featureId && !hasAccess
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeSection === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${isPremiumFeature ? 'opacity-75' : ''}`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                  {isPremiumFeature && (
                    <svg className="w-4 h-4 ml-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Show unavailable content if user doesn't have access to current tab */}
      {showUnavailableContent && !hasAccessToTab(activeSection) && (
        <div className="mt-6">
          <FeatureUnavailableCard 
            title={getTabInfo(activeSection).title}
            description={getTabInfo(activeSection).description}
          />
        </div>
      )}
    </div>
  )
}