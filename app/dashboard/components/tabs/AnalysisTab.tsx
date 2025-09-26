'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuditProject } from '@/types/audit'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AnalysisHeader from '../analysis-tab-components/AnalysisHeader'
import OverviewSection from '../analysis-tab-components/OverviewSection'
import PagesSection from '../analysis-tab-components/PagesSection'
import ImagesSection from '../analysis-tab-components/ImagesSection'
import LinksSection from '../analysis-tab-components/LinksSection'
import TechnologiesSection from '../analysis-tab-components/TechnologiesSection'
import PerformanceSection from '../analysis-tab-components/PerformanceSection'
import SEOAnalysisSection from '../analysis-tab-components/SEOAnalysisSection'
import CmsSection from '../analysis-tab-components/CmsSection'
import ModernLoader from '../analysis-tab-components/ModernLoader'

interface AnalysisTabProps {
  project: AuditProject
}

export default function AnalysisTab({ project }: AnalysisTabProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [scrapedPages, setScrapedPages] = useState<any[]>([])
  const [originalScrapingData, setOriginalScrapingData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Secure server-side scraping function
  const performSecureScraping = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      console.log('🚀 Starting secure scraping process...')
      
      // Prepare scraping data
      const scrapeFormData = {
        url: project.site_url,
        mode: 'multipage',
        maxPages: 500,
        extractImagesFlag: true,
        extractLinksFlag: true,
        detectTechnologiesFlag: true
      }
      
      // Use server-side proxy for secure API calls
      const apiEndpoint = '/api/scrape'
      
      // Simplified retry logic for server-side proxy
      const makeScrapingRequest = async (retries = 3, delay = 1000): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
          try {
            console.log(`🔄 Attempting scraping request (attempt ${i + 1}/${retries})`)
            
            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
              controller.abort()
            }, 180000) // 3 minute timeout
            
            const scrapeResponse = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(scrapeFormData),
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (!scrapeResponse.ok) {
              const errorData = await scrapeResponse.json().catch(() => ({}))
              console.error('❌ Server proxy error response:', errorData)
              throw new Error(errorData.error || `Server error: ${scrapeResponse.status} - ${scrapeResponse.statusText}`)
            }
            
            console.log('✅ Scraping request successful')
            return scrapeResponse
            
          } catch (error) {
            console.error(`❌ Scraping request failed (attempt ${i + 1}):`, error)
            
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Scraping request timed out after 3 minutes')
            }
            
            // If this is the last attempt, throw the error
            if (i === retries - 1) {
              throw error
            }
            
            // Wait before retrying with exponential backoff
            const waitTime = delay * Math.pow(2, i)
            console.log(`⏳ Waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
        
        throw new Error('All scraping request attempts failed')
      }
      
      const scrapeResponse = await makeScrapingRequest()
      const scrapeData = await scrapeResponse.json()
      
      // Process the scraping data
      await processScrapingData(scrapeData, project.id)
      
    } catch (apiError) {
      console.error('❌ Scraping API error:', apiError)
      setError(apiError instanceof Error ? apiError.message : 'Scraping failed')
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }, [user, project.site_url, project.id])

  // Process scraping data and save to database
  const processScrapingData = async (scrapeData: any, projectId: string) => {
    try {
      console.log('📊 Processing scraping data...')
      setProgress(20)

      // Store original scraping data
      setOriginalScrapingData(scrapeData)
      setProgress(40)

      // Process pages data
      if (scrapeData.pages && Array.isArray(scrapeData.pages)) {
        const processedPages = scrapeData.pages.map((page: any, index: number) => ({
          id: `${projectId}-page-${index}`,
          project_id: projectId,
          url: page.url,
          title: page.title || 'Untitled',
          html_content: page.html_content || '',
          images: page.images || [],
          links: page.links || [],
          technologies: page.technologies || [],
          metadata: page.metadata || {},
          created_at: new Date().toISOString()
        }))

        setScrapedPages(processedPages)
        setProgress(60)

        // Save to database
        const { error: insertError } = await supabase
          .from('scraped_pages')
          .upsert(processedPages, { onConflict: 'id' })

        if (insertError) {
          console.error('❌ Error saving scraped pages:', insertError)
          throw new Error('Failed to save scraped pages to database')
        }

        console.log('✅ Scraped pages saved to database')
        setProgress(80)
      }

      // Update project with scraping status
      const { error: updateError } = await supabase
        .from('audit_projects')
        .update({
          scraping_status: 'completed',
          last_scraped_at: new Date().toISOString(),
          scraping_data: scrapeData
        })
        .eq('id', projectId)

      if (updateError) {
        console.error('❌ Error updating project:', updateError)
      }

      setProgress(100)
      console.log('✅ Scraping process completed successfully')

    } catch (error) {
      console.error('❌ Error processing scraping data:', error)
      setError('Failed to process scraping data')
      throw error
    }
  }

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'links', label: 'Links', icon: '🔗' },
    { id: 'technologies', label: 'Technologies', icon: '⚙️' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'cms', label: 'CMS', icon: '🏗️' }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection project={project} scrapedPages={scrapedPages} />
      case 'pages':
        return <PagesSection project={project} scrapedPages={scrapedPages} />
      case 'images':
        return <ImagesSection project={project} scrapedPages={scrapedPages} originalScrapingData={originalScrapingData} />
      case 'links':
        return <LinksSection project={project} scrapedPages={scrapedPages} originalScrapingData={originalScrapingData} />
      case 'technologies':
        return <TechnologiesSection project={project} scrapedPages={scrapedPages} />
      case 'performance':
        return <PerformanceSection project={project} scrapedPages={scrapedPages} />
      case 'seo':
        return <SEOAnalysisSection project={project} scrapedPages={scrapedPages} />
      case 'cms':
        return <CmsSection project={project} scrapedPages={scrapedPages} />
      default:
        return <OverviewSection project={project} scrapedPages={scrapedPages} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisHeader 
        project={project}
        onStartScraping={performSecureScraping}
        isLoading={isLoading}
        error={error}
        progress={progress}
      />

      {isLoading && <ModernLoader progress={progress} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  )
}
