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
  customTabs?: Array<{ id: string; name: string; icon: any }>
  pageTitle?: string
  showUnavailableContent?: boolean // New prop to control showing unavailable content
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function AnalysisHeader({ project, activeSection, onSectionChange, customTabs, pageTitle, showUnavailableContent = false, onRefresh, isRefreshing }: AnalysisHeaderProps) {
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
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-blue-200 text-blue-900'
      case 'pending':
        return 'bg-blue-50 text-blue-700'
      case 'failed':
        return 'bg-blue-300 text-blue-900'
      default:
        return 'bg-blue-100 text-blue-800'
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
    <div className=" p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex flex-col space-y-3 min-w-0">
          {currentTab === 'page-analysis' && (
            <button
              onClick={() => router.push(`/dashboard?tab=analysis&projectId=${project.id}`)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-fit"
            >
              Back
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 truncate">
              {pageTitle || getProjectName(project.site_url)} 
            </h1>
            <p className="text-gray-600 break-all text-sm sm:text-base">{project.site_url}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {getStatusDisplayName(project.status)}
          </span> */}
          {/* <div className="text-right">
            <div className={`text-2xl font-bold ${project.score >= 80 ? 'text-blue-600' : project.score >= 60 ? 'text-blue-500' : 'text-blue-400'}`}>
              {project.score > 0 ? project.score : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">/100</div>
          </div> */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        {isLoadingPlan ? (
          <div className="py-4">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center space-x-2 flex-shrink-0">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
              {(customTabs || [
                { id: 'overview', name: 'Overview', icon: 'fas fa-chart-bar' },
                { id: 'pages', name: 'Pages', icon: 'fas fa-file-alt' },
                { id: 'technologies', name: 'Technical', icon: 'fas fa-cogs' },
                ...(project.cms_detected ? [{ id: 'cms', name: 'CMS', icon: 'fas fa-building' }] : []),
                { id: 'performance', name: 'Performance', icon: 'fas fa-tachometer-alt' },
                { id: 'seo', name: 'SEO', icon: 'fas fa-search' },
                { id: 'images', name: 'Images', icon: 'fas fa-image' },
                { id: 'links', name: 'Links', icon: 'fas fa-link' }
              ])
              .map((tab) => {
                const hasAccess = hasAccessToTab(tab.id)
                const featureId = getFeatureIdForTab(tab.id)
                const isPremiumFeature = featureId && !hasAccess
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onSectionChange(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap flex-shrink-0 ${
                      activeSection === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
                    } ${isPremiumFeature ? 'opacity-75' : ''}`}
                  >
                    {tab.name}
                    {isPremiumFeature && (
                      <span className="text-blue-500 text-xs ml-1">★</span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
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