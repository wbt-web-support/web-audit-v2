'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'

interface DashboardOverviewProps {
  userProfile: any
}

interface BrandConsistencyData {
  companyName: string
  phoneNumber: string
  emailAddress: string
  address: string
  additionalInformation: string
}

interface HiddenUrl {
  id: string
  url: string
}

interface Project {
  id: number
  name: string
  status: 'In Progress' | 'Completed' | 'Pending' | 'Failed'
  progress: number
  lastAudit: string
  url: string
  issues: number
  score: number
}

interface Plan {
  id: number
  name: string
  price: string
  features: string[]
  isPopular?: boolean
  isCurrent?: boolean
}

interface Feature {
  id: number
  name: string
  description: string
  icon: string
  category: 'Performance' | 'SEO' | 'Security' | 'Accessibility'
}

export default function DashboardOverview({ userProfile }: DashboardOverviewProps) {
  const { createAuditProject, getAuditProjects } = useSupabase()
  
  // Site Crawl Form States
  const [siteUrl, setSiteUrl] = useState('')
  const [pageType, setPageType] = useState<'single' | 'multiple'>('single')
  const [brandConsistency, setBrandConsistency] = useState(false)
  const [hiddenUrls, setHiddenUrls] = useState(false)
  const [keysCheck, setKeysCheck] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  
  const [brandData, setBrandData] = useState<BrandConsistencyData>({
    companyName: '',
    phoneNumber: '',
    emailAddress: '',
    address: '',
    additionalInformation: ''
  })
  
  const [hiddenUrlsList, setHiddenUrlsList] = useState<HiddenUrl[]>([
    { id: '1', url: '' }
  ])

  // Sample Data
  const projects: Project[] = [
    {
      id: 1,
      name: 'E-commerce Website',
      status: 'In Progress',
      progress: 75,
      lastAudit: '2 hours ago',
      url: 'https://example-store.com',
      issues: 12,
      score: 85
    },
    {
      id: 2,
      name: 'Portfolio Site',
      status: 'Completed',
      progress: 100,
      lastAudit: '1 day ago',
      url: 'https://portfolio.example.com',
      issues: 3,
      score: 92
    },
    {
      id: 3,
      name: 'Blog Platform',
      status: 'Pending',
      progress: 0,
      lastAudit: '3 days ago',
      url: 'https://blog.example.com',
      issues: 0,
      score: 0
    },
    {
      id: 4,
      name: 'Corporate Website',
      status: 'Completed',
      progress: 100,
      lastAudit: '1 week ago',
      url: 'https://corporate.example.com',
      issues: 8,
      score: 88
    }
  ]

  const plans: Plan[] = [
    {
      id: 1,
      name: 'Starter',
      price: '$29/month',
      features: ['Up to 5 projects', 'Basic SEO audit', 'Performance check', 'Email support'],
      isCurrent: true
    },
    {
      id: 2,
      name: 'Professional',
      price: '$79/month',
      features: ['Up to 25 projects', 'Advanced SEO audit', 'Security scan', 'Brand consistency check', 'Priority support'],
      isPopular: true
    },
    {
      id: 3,
      name: 'Enterprise',
      price: '$199/month',
      features: ['Unlimited projects', 'Full audit suite', 'Custom reports', 'API access', 'Dedicated support']
    }
  ]

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

  const handleBrandDataChange = (field: keyof BrandConsistencyData, value: string) => {
    setBrandData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addHiddenUrl = () => {
    const newId = (hiddenUrlsList.length + 1).toString()
    setHiddenUrlsList(prev => [...prev, { id: newId, url: '' }])
  }

  const removeHiddenUrl = (id: string) => {
    if (hiddenUrlsList.length > 1) {
      setHiddenUrlsList(prev => prev.filter(url => url.id !== id))
    }
  }

  const updateHiddenUrl = (id: string, value: string) => {
    setHiddenUrlsList(prev => prev.map(url => 
      url.id === id ? { ...url, url: value } : url
    ))
  }

  // Test function to check database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...')
      const { data, error } = await getAuditProjects()
      if (error) {
        console.error('Database connection test failed:', error)
        return false
      }
      console.log('Database connection test passed. Found projects:', data?.length || 0)
      return true
    } catch (error) {
      console.error('Database connection test error:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('submitting')
    
    // Set up 20-second timeout
    const timeoutId = setTimeout(() => {
      console.error('Form submission timed out after 20 seconds')
      setSubmitStatus('error')
      setIsSubmitting(false)
      alert('Form submission timed out. Please check your internet connection and try again.')
    }, 20000)
    
    try {
      // Test database connection first
      console.log('Testing database connection before submission...')
      const dbConnected = await testDatabaseConnection()
      if (!dbConnected) {
        clearTimeout(timeoutId)
        setSubmitStatus('error')
        alert('Database connection failed. Please check your connection and try again.')
        return
      }

      // Ensure the URL has https:// protocol
      let formattedUrl = siteUrl.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`
      }
      
      // Prepare the project data
      const projectData = {
        site_url: formattedUrl,
        page_type: pageType,
        brand_consistency: brandConsistency,
        hidden_urls: hiddenUrls,
        keys_check: keysCheck,
        brand_data: brandConsistency ? brandData : null,
        hidden_urls_data: hiddenUrls ? hiddenUrlsList.filter(url => url.url.trim() !== '') : null,
        status: 'pending' as const,
        progress: 0,
        score: 0,
        issues_count: 0
      }

      console.log('Submitting audit project:', projectData)

      // Create the audit project with timeout
      const createProjectPromise = createAuditProject(projectData)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timed out')), 15000)
      )
      
      const { data, error } = await Promise.race([createProjectPromise, timeoutPromise]) as any

      if (error) {
        clearTimeout(timeoutId)
        console.error('Error creating audit project:', error)
        setSubmitStatus('error')
        alert(`Failed to create audit project: ${error.message || 'Unknown error'}`)
        return
      }

      if (!data) {
        clearTimeout(timeoutId)
        console.error('No data returned from createAuditProject')
        setSubmitStatus('error')
        alert('Failed to create audit project: No data returned')
        return
      }

      // Clear timeout on success
      clearTimeout(timeoutId)
      console.log('Audit project created successfully:', data)
      setSubmitStatus('success')
      
      // Reset form
      setSiteUrl('')
      setPageType('single')
      setBrandConsistency(false)
      setHiddenUrls(false)
      setKeysCheck(false)
      setBrandData({
        companyName: '',
        phoneNumber: '',
        emailAddress: '',
        address: '',
        additionalInformation: ''
      })
      setHiddenUrlsList([{ id: '1', url: '' }])
      
      // Show success message
      alert(`Audit project created successfully! Project ID: ${data.id}`)
      
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Unexpected error creating audit project:', error)
      setSubmitStatus('error')
      
      if (error instanceof Error && error.message === 'Database operation timed out') {
        alert('Database operation timed out. Please check your connection and try again.')
      } else {
        alert(`An unexpected error occurred: ${error}`)
      }
    } finally {
      setIsSubmitting(false)
      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 3000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
              <p className="text-sm text-green-600 mt-1">+2 from last month</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{projects.filter(p => p.status === 'In Progress').length}</p>
              <p className="text-sm text-blue-600 mt-1">+1 from last week</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Professional</p>
              <p className="text-sm text-purple-600 mt-1">$79/month</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">92%</p>
              <p className="text-sm text-green-600 mt-1">+5% from last month</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Row - Site Crawl and Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* New Site Crawl Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Site Crawl</h2>
                <p className="text-gray-600 text-sm">Start a comprehensive web audit</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL Input */}
              <div>
                <label htmlFor="siteUrl" className="block text-sm font-semibold text-gray-800 mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    id="siteUrl"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-3 border text-black border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Page Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Crawl Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    pageType === 'single' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="pageType"
                      value="single"
                      checked={pageType === 'single'}
                      onChange={(e) => setPageType(e.target.value as 'single' | 'multiple')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        pageType === 'single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {pageType === 'single' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Single Page</span>
                    </div>
                  </label>
                  <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    pageType === 'multiple' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="pageType"
                      value="multiple"
                      checked={pageType === 'multiple'}
                      onChange={(e) => setPageType(e.target.value as 'single' | 'multiple')}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        pageType === 'multiple' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {pageType === 'multiple' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Multiple Pages</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Feature Checkboxes */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Audit Features
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'brandConsistency', label: 'Brand Consistency' },
                    { key: 'hiddenUrls', label: 'Hidden URLs' },
                    { key: 'keysCheck', label: 'Keys Check' }
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={feature.key === 'brandConsistency' ? brandConsistency : feature.key === 'hiddenUrls' ? hiddenUrls : keysCheck}
                        onChange={(e) => {
                          if (feature.key === 'brandConsistency') setBrandConsistency(e.target.checked)
                          else if (feature.key === 'hiddenUrls') setHiddenUrls(e.target.checked)
                          else setKeysCheck(e.target.checked)
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      {/* <span className="text-2xl mr-3">{feature.icon}</span> */}
                      <span className="text-sm font-medium text-gray-700 pl-2">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Consistency Fields */}
              {brandConsistency && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-4 border border-blue-100"
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">🎨</span>
                    Brand Consistency Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        value={brandData.companyName}
                        onChange={(e) => handleBrandDataChange('companyName', e.target.value)}
                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          value={brandData.phoneNumber}
                          onChange={(e) => handleBrandDataChange('phoneNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="emailAddress"
                          value={brandData.emailAddress}
                          onChange={(e) => handleBrandDataChange('emailAddress', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={brandData.address}
                        onChange={(e) => handleBrandDataChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="additionalInformation" className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Information
                      </label>
                      <textarea
                        id="additionalInformation"
                        value={brandData.additionalInformation}
                        onChange={(e) => handleBrandDataChange('additionalInformation', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
              </div>
            </div>
          </motion.div>
              )}

              {/* Hidden URLs Fields */}
              {hiddenUrls && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="text-2xl mr-2">🔍</span>
                      Hidden URLs
                    </h3>
                    <button
                      type="button"
                      onClick={addHiddenUrl}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add URL
                    </button>
                  </div>
                  <div className="space-y-3">
                    {hiddenUrlsList.map((hiddenUrl, index) => (
                      <div key={hiddenUrl.id} className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={hiddenUrl.url}
                          onChange={(e) => updateHiddenUrl(hiddenUrl.id, e.target.value)}
                          placeholder="https://example.com/hidden-page"
                          className="flex-1 px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        />
                        {hiddenUrlsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHiddenUrl(hiddenUrl.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
        ))}
      </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg ${
                    submitStatus === 'success' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : submitStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    {submitStatus === 'success' ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Project Created Successfully!
                      </>
                    ) : submitStatus === 'error' ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Error - Try Again
                      </>
                    ) : isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Start Site Crawl
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Recent Projects Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                  <p className="text-gray-600 text-sm">Your latest audit activities</p>
                </div>
              </div>
              <button className="text-gray-600 hover:text-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
        </div>
          
        <div className="p-6">
          <div className="space-y-4">
              {projects.slice(0, 3).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-100 hover:border-gray-200 hover:shadow-sm"
              >
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Last audit: {project.lastAudit}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {project.issues} issues
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Score: {project.score > 0 ? `${project.score}/100` : 'N/A'}
                      </span>
                    </div>
                </div>
                  <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{project.progress}%</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                      View Details →
                    </button>
                </div>
              </motion.div>
            ))}
          </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full text-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                View All Projects
              </button>
            </div>
        </div>
        </motion.div>
      </div>

      {/* Features Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Audit Features</h2>
                <p className="text-gray-600 text-sm">Comprehensive web audit capabilities</p>
              </div>
            </div>
            <button className="text-gray-600 hover:text-gray-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.slice(0, 6).map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-start mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.category === 'Performance' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      )}
                      {feature.category === 'SEO' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      )}
                      {feature.category === 'Security' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                      {feature.category === 'Accessibility' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{feature.name}</h3>
                    <span className="inline-block text-xs px-3 py-1 rounded-full font-medium mt-2 bg-gray-100 text-gray-700">
                      {feature.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors group-hover:underline">
                    Learn More →
                  </button>
            </div>
              </motion.div>
            ))}
            </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg">
                Explore All Features
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
