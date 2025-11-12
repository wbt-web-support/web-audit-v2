'use client'

// import { motion } from 'framer-motion' // Unused import
import { useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { useUserPlan } from '@/hooks/useUserPlan'
import SiteCrawlForm from '../dashboard-components/SiteCrawlForm'
import { StatsCards, RecentProjects, FeaturesShowcase } from '../dashboard-components'
import UpgradeModal from '../modals/UpgradeModal'
import { useProjectsStore } from '@/lib/stores/projectsStore'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'admin'
  email_confirmed: boolean
  created_at: string
  updated_at?: string
}

interface DashboardOverviewProps {
  userProfile: UserProfile | null
  onProjectSelect?: (projectId: string) => void
}

interface Feature {
  id: number
  name: string
  description: string
  icon: string
  category: 'Performance' | 'SEO' | 'Security' | 'Accessibility'
}

export default function DashboardOverview({ 
  userProfile, 
  onProjectSelect
}: DashboardOverviewProps) {
  // Use Zustand store for projects data
  const { projects, loading: projectsLoading, error: _projectsError, refreshProjects } = useProjectsStore();
  const { createAuditProject } = useSupabase()
  const { planInfo } = useUserPlan()
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  
  // Upgrade modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    title: string
    description: string
    featureName: string
  }>({
    title: '',
    description: '',
    featureName: ''
  })



  // Test function to check database connection
  const testDatabaseConnection = async () => {
    try {
      
      
      // Use refreshProjects to test connection
      await refreshProjects()
      
      return true
    } catch (error) {
      console.error('Database connection test error:', error)
      return false
    }
  }


  // Handle form submission from SiteCrawlForm
  const handleFormSubmit = async (formData: {
    siteUrl: string
    pageType: 'single' | 'multiple'
    brandConsistency: boolean
    hiddenUrls: boolean
    keysCheck: boolean
    brandData: {
      companyName: string
      phoneNumber: string
      emailAddress: string
      address: string
      additionalInformation: string
    }
    hiddenUrlsList: Array<{ id: string; url: string }>
  }) => {
    
    setIsSubmitting(true)
    setSubmitStatus('submitting')
    
    try {
      // Test database connection first
      
      const dbConnected = await testDatabaseConnection()
      
      
      if (!dbConnected) {
        console.warn('⚠️ Database connection test failed, but continuing with form submission...')
      } else {
        
      }

      // Ensure the URL has https:// protocol
      
      let formattedUrl = formData.siteUrl.trim()
      
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`
        
      } else {
        
      }
      
      // Prepare the project data
      
      const projectData = {
        site_url: formattedUrl,
        page_type: formData.pageType,
        brand_consistency: formData.brandConsistency,
        hidden_urls: formData.hiddenUrls,
        keys_check: formData.keysCheck,
        brand_data: formData.brandConsistency ? formData.brandData : null,
        hidden_urls_data: formData.hiddenUrls ? formData.hiddenUrlsList.filter(url => url.url.trim() !== '') : null,
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
        scraping_data: null,
        // CMS fields
        cms_type: null,
        cms_version: null,
        cms_plugins: null,
        cms_themes: null,
        cms_components: null,
        cms_confidence: 0,
        cms_detection_method: null,
        cms_metadata: null,
        // Technologies fields
        technologies: null,
        technologies_confidence: 0,
        technologies_detection_method: null,
        technologies_metadata: null,
        // PageSpeed Insights fields
        pagespeed_insights_data: null,
        pagespeed_insights_loading: false,
        pagespeed_insights_error: null,
        // SEO Analysis fields
        seo_analysis: null,
        // Meta tags fields
        meta_tags_data: null,
        social_meta_tags_data: null,
        // Keys detection fields
        detected_keys: null
      }

      

      // Create the audit project
      
      const { data: createdProject, error: projectError } = await createAuditProject(projectData)
      
      if (projectError) {
        // Handle empty error object first - show modal, no error logging
        if (!projectError.message && !projectError.code && Object.keys(projectError).length === 0) {
          setUpgradeModalConfig({
            title: 'Project Limit Reached',
            description: 'You may have reached your project limit. Please upgrade your plan to create more projects.',
            featureName: 'project_limit'
          })
          setShowUpgradeModal(true)
          return
        }
        
        setSubmitStatus('error')
        
        // Handle specific error codes
        if (projectError.code === 'PROJECT_LIMIT_REACHED') {
          setUpgradeModalConfig({
            title: 'Project Limit Reached',
            description: projectError.message || 'You have reached your project limit. Upgrade to create more projects.',
            featureName: 'project_limit'
          })
          setShowUpgradeModal(true)
        } else if (projectError.code === 'FEATURE_NOT_AVAILABLE') {
          setUpgradeModalConfig({
            title: 'Feature Not Available',
            description: projectError.message || 'This feature is not available in your current plan.',
            featureName: 'full_site_crawl'
          })
          setShowUpgradeModal(true)
        } else if (projectError.code === 'RLS_POLICY_ISSUE') {
          alert(`Database permission issue: ${projectError.message}. Please contact support.`)
        } else if (projectError.code === 'TABLE_NOT_EXISTS') {
          alert(`Database setup issue: ${projectError.message}. Please contact support.`)
        } else {
          // For other errors, show a simple alert
          alert(`Failed to create project: ${projectError.message || 'Please try again.'}`)
        }
        return
      }

      if (!createdProject) {
        console.error('❌ No project created')
        setSubmitStatus('error')
        alert('Failed to create project. Please try again.')
        return
      }

      
      setSubmitStatus('success')
      
      // Refresh projects data to show the new project
      await refreshProjects()
      
      // Redirect to analysis tab immediately
      
      if (onProjectSelect) {
        onProjectSelect(createdProject.id)
      }
      
    } catch (error) {
      console.error('❌ Unexpected error in form submission:', error)
      setSubmitStatus('error')
      alert(`An unexpected error occurred: ${error}`)
    } finally {
      
      setIsSubmitting(false)
      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 3000)
    }
  }


  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Welcome back, {userProfile?.first_name || 'User'}!
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Here&apos;s what&apos;s happening with your web audits today.
        </p>
      </div>

      {/* Main Content Row - Site Crawl and Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Site Crawl Form - Takes full width on mobile, 8 columns on lg+ */}
        <div className="lg:col-span-8 h-full">
          <SiteCrawlForm 
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            submitStatus={submitStatus}
          />
        </div>
        {/* Stats Cards - Takes full width on mobile, 4 columns on lg+ */}
        <div className="lg:col-span-4 h-full">
          <StatsCards 
            projects={projects}
            projectsLoading={projectsLoading}
          />
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mt-8">
        <RecentProjects 
          onProjectSelect={onProjectSelect}
        />
      </div>
      {/* Features Showcase */}
      {/* <FeaturesShowcase features={features} /> */}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={upgradeModalConfig.title}
        description={upgradeModalConfig.description}
        featureName={upgradeModalConfig.featureName}
        currentPlan={planInfo ? {
          name: planInfo.plan_name,
          type: planInfo.plan_type,
          maxProjects: planInfo.max_projects,
          currentProjects: planInfo.current_projects
        } : undefined}
      />
    </div>
  )
}
