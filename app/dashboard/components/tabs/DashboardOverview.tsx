'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { useAuditProjects } from '@/contexts/AuditProjectsContext'
import SiteCrawlForm from '../SiteCrawlForm'
import ScrapingService from '../ScrapingService'
import StatsCards from '../StatsCards'
import RecentProjects from '../RecentProjects'
import FeaturesShowcase from '../FeaturesShowcase'

interface DashboardOverviewProps {
  userProfile: any
}

// Project interface removed - RecentProjects now handles its own data fetching

interface Feature {
  id: number
  name: string
  description: string
  icon: string
  category: 'Performance' | 'SEO' | 'Security' | 'Accessibility'
}

export default function DashboardOverview({ userProfile }: DashboardOverviewProps) {
  const { createAuditProject, updateAuditProject } = useSupabase()
  const { refreshProjects } = useAuditProjects()
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [apiResult, setApiResult] = useState<any>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  // Sample data removed - RecentProjects now fetches real data from database


  const features: Feature[] = [
    {
      id: 1,
      name: 'Performance Audit',
      description: 'Analyze page speed, Core Web Vitals, and optimization opportunities',
      icon: '⚡',
      category: 'Performance'
    },
    {
      id: 2,
      name: 'SEO Analysis',
      description: 'Check meta tags, headings, alt text, and search engine optimization',
      icon: '🔍',
      category: 'SEO'
    },
    {
      id: 3,
      name: 'Security Scan',
      description: 'Identify security vulnerabilities and SSL certificate issues',
      icon: '🔒',
      category: 'Security'
    },
    {
      id: 4,
      name: 'Accessibility Check',
      description: 'Ensure your site is accessible to users with disabilities',
      icon: '♿',
      category: 'Accessibility'
    },
    {
      id: 5,
      name: 'Brand Consistency',
      description: 'Verify consistent branding across all pages and elements',
      icon: '🎨',
      category: 'Performance'
    },
    {
      id: 6,
      name: 'Mobile Optimization',
      description: 'Check mobile responsiveness and mobile-specific issues',
      icon: '📱',
      category: 'Performance'
    }
  ]


  // Test function to check database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...')
      
      // Use refreshProjects to test connection
      await refreshProjects()
      console.log('Database connection test passed.')
      return true
    } catch (error) {
      console.error('Database connection test error:', error)
      return false
    }
  }


  // Handle form submission from SiteCrawlForm
  const handleFormSubmit = async (formData: any) => {
    console.log('🚀 Form submission started')
    setIsSubmitting(true)
    setSubmitStatus('submitting')
    
    // Set up 20-second timeout
    const timeoutId = setTimeout(() => {
      console.error('⏰ Form submission timed out after 20 seconds')
      setSubmitStatus('error')
      setIsSubmitting(false)
      alert('Form submission timed out. Please check your internet connection and try again.')
    }, 20000)
    
    try {
      // Test database connection first
      console.log('🔍 Step 1: Testing database connection...')
      const dbConnected = await testDatabaseConnection()
      console.log('📊 Database connection result:', dbConnected)
      
      if (!dbConnected) {
        console.warn('⚠️ Database connection test failed, but continuing with form submission...')
      } else {
        console.log('✅ Database connection successful')
      }

      // Ensure the URL has https:// protocol
      console.log('🔍 Step 2: Formatting URL...')
      let formattedUrl = formData.siteUrl.trim()
      console.log('📝 Original URL:', formData.siteUrl)
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`
        console.log('🔧 Added https:// prefix:', formattedUrl)
      } else {
        console.log('✅ URL already has protocol:', formattedUrl)
      }
      
      // Prepare the project data
      console.log('🔍 Step 3: Preparing project data...')
      const projectData = {
        site_url: formattedUrl,
        page_type: formData.pageType,
        brand_consistency: formData.brandConsistency,
        hidden_urls: formData.hiddenUrls,
        keys_check: formData.keysCheck,
        brand_data: formData.brandConsistency ? formData.brandData : null,
        hidden_urls_data: formData.hiddenUrls ? formData.hiddenUrlsList.filter((url: any) => url.url.trim() !== '') : null,
        status: 'pending' as const,
        progress: 0,
        score: 0,
        issues_count: 0,
        total_pages: 0,
        total_links: 0,
        total_images: 0,
        total_meta_tags: 0,
        technologies_found: 0,
        cms_detected: false,
        total_html_content: 0,
        average_html_per_page: 0,
        pages_per_second: 0,
        total_response_time: 0,
        scraping_completed_at: null,
        scraping_data: null
      }

      console.log('📊 Project data prepared:', projectData)

      // Create the audit project with timeout
      console.log('🔍 Step 4: Creating audit project in database...')
      let createdProject = null
      let currentProjectId = null
      
      try {
        const createProjectPromise = createAuditProject(projectData)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timed out')), 10000)
        )
        
        console.log('⏳ Waiting for database operation (10s timeout)...')
        const { data, error } = await Promise.race([createProjectPromise, timeoutPromise]) as any
        console.log('📊 Database operation result:', { data, error })

        if (error) {
          console.warn('⚠️ Database creation failed, but continuing with API call...', error)
        } else if (data) {
          createdProject = data
          currentProjectId = data.id
          setProjectId(data.id)
          console.log('✅ Audit project created successfully:', data)
        } else {
          console.warn('⚠️ No data returned from createAuditProject, but continuing...')
        }
      } catch (dbError) {
        console.warn('⚠️ Database operation failed, but continuing with API call...', dbError)
      }

      // Clear timeout on success
      clearTimeout(timeoutId)
      setSubmitStatus('success')
      
      // Refresh projects data to show the new project
      if (createdProject) {
        await refreshProjects()
      }
      
      // Make API request to scraping service
      try {
        console.log('🔍 Step 5: Making API request to scraping service...')
        
        const scrapeFormData = {
          url: formattedUrl,
          mode: formData.pageType === 'single' ? 'single' : 'multipage',
          maxPages: 100,
          extractImagesFlag: true,
          extractLinksFlag: true,
          detectTechnologiesFlag: true
        }
        
        console.log('📊 Scraping request data:', scrapeFormData)
        
        const apiEndpoint = process.env.NEXT_PUBLIC_SCRAPER_API_ENDPOINT || 'http://localhost:3001/scrap'
        console.log('🌐 API endpoint:', apiEndpoint)
        
        console.log('⏳ Making fetch request...')
        const scrapeResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scrapeFormData)
        })
        
        console.log('📊 Scraping response status:', scrapeResponse.status)
        console.log('📊 Scraping response ok:', scrapeResponse.ok)
        
        if (!scrapeResponse.ok) {
          throw new Error(`Scraping API error: ${scrapeResponse.status}`)
        }
        
        console.log('⏳ Parsing JSON response...')
        const scrapeData = await scrapeResponse.json()
        console.log('✅ Scraping API response:', scrapeData)
        setApiResult(scrapeData)
        
      } catch (apiError) {
        console.error('❌ Scraping API error:', apiError)
        setApiResult({ error: 'Failed to start scraping process' })
      }
      
      // Show success message
      const projectIdMessage = currentProjectId ? `Project ID: ${currentProjectId}` : 'Project ID: N/A (Database issue)'
      const scrapingStatus = apiResult ? 'Scraping process started.' : 'Note: Scraping process failed to start.'
      alert(`Form submitted successfully!\n${projectIdMessage}\n${scrapingStatus}`)
      
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ Unexpected error in form submission:', error)
      setSubmitStatus('error')
      alert(`An unexpected error occurred: ${error}`)
    } finally {
      console.log('🏁 Form submission process completed')
      setIsSubmitting(false)
      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 3000)
    }
  }


  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {userProfile?.first_name || 'User'}!
        </h1>
        <p className="text-blue-100">
          Here's what's happening with your web audits today.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Row - Site Crawl and Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Site Crawl Form */}
        <SiteCrawlForm 
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitStatus={submitStatus}
        />

        {/* Recent Projects */}
        <RecentProjects />
      </div>

      {/* Features Showcase */}
      <FeaturesShowcase features={features} />

      {/* Scraping Service - handles data processing */}
      <ScrapingService 
        projectId={projectId}
        scrapingData={apiResult}
        onScrapingComplete={(success) => {
          console.log('Scraping completed:', success)
        }}
      />

      {/* API Result Display */}
      {apiResult && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Scraping API Response:</h3>
          <pre className="text-xs text-blue-800 bg-blue-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
