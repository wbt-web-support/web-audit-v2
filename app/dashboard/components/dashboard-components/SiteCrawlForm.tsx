'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

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

interface SiteCrawlFormProps {
  onSubmit: (formData: {
    siteUrl: string
    pageType: 'single' | 'multiple'
    brandConsistency: boolean
    hiddenUrls: boolean
    keysCheck: boolean
    brandData: BrandConsistencyData
    hiddenUrlsList: HiddenUrl[]
  }) => void
  isSubmitting: boolean
  submitStatus: 'idle' | 'submitting' | 'success' | 'error'
  isEditMode?: boolean
  initialData?: {
    siteUrl: string
    pageType: 'single' | 'multiple'
    brandConsistency: boolean
    hiddenUrls: boolean
    keysCheck: boolean
    brandData: BrandConsistencyData
    hiddenUrlsList: HiddenUrl[]
  }
}

export default function SiteCrawlForm({ onSubmit, isSubmitting, submitStatus, isEditMode = false, initialData }: SiteCrawlFormProps) {
  // Form States
  const [siteUrl, setSiteUrl] = useState('')
  const [pageType, setPageType] = useState<'single' | 'multiple'>('single')
  const [brandConsistency, setBrandConsistency] = useState(false)
  const [hiddenUrls, setHiddenUrls] = useState(false)
  const [keysCheck, setKeysCheck] = useState(false)
  
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

  // Initialize form data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setSiteUrl(initialData.siteUrl)
      setPageType(initialData.pageType)
      setBrandConsistency(initialData.brandConsistency)
      setHiddenUrls(initialData.hiddenUrls)
      setKeysCheck(initialData.keysCheck)
      setBrandData(initialData.brandData)
      setHiddenUrlsList(initialData.hiddenUrlsList)
    }
  }, [isEditMode, initialData])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('SiteCrawlForm: Form submitted with data:', {
      siteUrl,
      pageType,
      brandConsistency,
      hiddenUrls,
      keysCheck,
      brandData,
      hiddenUrlsList
    })
    onSubmit({
      siteUrl,
      pageType,
      brandConsistency,
      hiddenUrls,
      keysCheck,
      brandData,
      hiddenUrlsList
    })
  }

  // const resetForm = () => {
  //   setSiteUrl('')
  //   setPageType('single')
  //   setBrandConsistency(false)
  //   setHiddenUrls(false)
  //   setKeysCheck(false)
  //   setBrandData({
  //     companyName: '',
  //     phoneNumber: '',
  //     emailAddress: '',
  //     address: '',
  //     additionalInformation: ''
  //   })
  //   setHiddenUrlsList([{ id: '1', url: '' }])
  // }

  return (
    <motion.div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {!isEditMode && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">New Site Crawl</h2>
            <p className="text-gray-600 text-sm">Start a comprehensive web audit</p>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="siteUrl" className="block text-sm font-medium text-black mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="siteUrl"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Page Type Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Crawl Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center p-4 border rounded cursor-pointer ${
                pageType === 'single' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
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
                  <span className="text-sm font-medium text-black">Single Page</span>
                </div>
              </label>
              <label className={`flex items-center p-4 border rounded cursor-pointer ${
                pageType === 'multiple' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
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
                  <span className="text-sm font-medium text-black">Multiple Pages</span>
                </div>
              </label>
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Audit Features
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'brandConsistency', label: 'Brand Consistency' },
                { key: 'hiddenUrls', label: 'Hidden URLs' },
                { key: 'keysCheck', label: 'Keys Check' }
              ].map((feature) => (
                <label key={feature.key} className="flex items-center p-3 border border-gray-200 rounded cursor-pointer">
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
                  <span className="text-sm font-medium text-black pl-2">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Consistency Fields */}
          {brandConsistency && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
              <h3 className="text-base font-semibold text-black">
                Brand Consistency Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-black mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={brandData.companyName}
                    onChange={(e) => handleBrandDataChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-black mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={brandData.phoneNumber}
                      onChange={(e) => handleBrandDataChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-black mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="emailAddress"
                      value={brandData.emailAddress}
                      onChange={(e) => handleBrandDataChange('emailAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={brandData.address}
                    onChange={(e) => handleBrandDataChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="additionalInformation" className="block text-sm font-medium text-black mb-1">
                    Additional Information
                  </label>
                  <textarea
                    id="additionalInformation"
                    value={brandData.additionalInformation}
                    onChange={(e) => handleBrandDataChange('additionalInformation', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-black border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hidden URLs Fields */}
          {hiddenUrls && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-black">
                  Hidden URLs
                </h3>
                <button
                  type="button"
                  onClick={addHiddenUrl}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add URL
                </button>
              </div>
              <div className="space-y-3">
                {hiddenUrlsList.map((hiddenUrl) => (
                  <div key={hiddenUrl.id} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={hiddenUrl.url}
                      onChange={(e) => updateHiddenUrl(hiddenUrl.id, e.target.value)}
                      placeholder="https://example.com/hidden-page"
                      className="flex-1 px-3 py-2 text-black border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {hiddenUrlsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHiddenUrl(hiddenUrl.id)}
                        className="p-2 text-gray-600 rounded cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer ${
                submitStatus === 'success' 
                  ? 'bg-green-600 text-white' 
                  : submitStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : isSubmitting 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white'
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
                    {isEditMode ? 'Updating Project...' : 'Creating Project...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isEditMode ? 'Update Project' : 'Start Site Crawl'}
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
