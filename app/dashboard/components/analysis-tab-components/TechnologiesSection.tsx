'use client'

import { useState } from 'react'
import { AuditProject } from '@/types/audit'
import { TechnologiesTab, KeysTab, SocialPreviewTab } from './subtabs'
import { ScrapedPage } from '../analysis-tab/types'

interface TechnologiesSectionProps {
  project: AuditProject
  scrapedPages?: ScrapedPage[]
}

export default function TechnologiesSection({ project, scrapedPages = [] }: TechnologiesSectionProps) {
  const [activeTab, setActiveTab] = useState('technologies')

  // Get HTML content from scraped pages (use first page or homepage)
  const getHtmlContent = () => {
    if (!scrapedPages || scrapedPages.length === 0) {
      return null
    }

    // Try to find homepage first
    const homepage = scrapedPages.find(page => {
      try {
        const url = new URL(page.url)
        return url.pathname === '/' || url.pathname === '' || url.pathname === '/index.html'
      } catch {
        return false
      }
    })

    // Use homepage or first page
    const targetPage = homepage || scrapedPages[0]
    return targetPage.html_content || null
  }

  const htmlContent = getHtmlContent()

  // Debug logging

  const tabs = [
    {
      id: 'technologies',
      name: 'Technologies',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'keys',
      name: 'Keys',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      )
    },
    {
      id: 'social',
      name: 'Social Preview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'technologies':
        return (
          <TechnologiesTab
            project={project}
            htmlContent={htmlContent || undefined}
            headers={undefined} // Could be extracted from scraped pages if available
            cookies={undefined} // Could be extracted from scraped pages if available
          />
        )
      case 'keys':
        return <KeysTab key={`keys-${project.id}-${project.detected_keys ? 'has-data' : 'no-data'}`} project={project} />
      case 'social':
        return <SocialPreviewTab project={project} />
      default:
        return (
          <TechnologiesTab
            project={project}
            htmlContent={htmlContent || undefined}
            headers={undefined}
            cookies={undefined}
          />
        )
    }
  }

  return (
    <div className="bg-white rounded-lg  border border-gray-200">
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}
