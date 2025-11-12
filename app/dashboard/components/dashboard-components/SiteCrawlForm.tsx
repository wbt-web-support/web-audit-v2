'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useUserPlan } from '@/hooks/useUserPlan';
import UpgradeModal from '@/app/dashboard/components/modals/UpgradeModal';
type CrawlType = 'single' | 'multiple';
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
interface BrandConsistencyData {
  companyName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  additionalInformation: string;
}
interface HiddenUrl {
  id: string;
  url: string;
}
interface SiteCrawlFormData {
  siteUrl: string;
  pageType: CrawlType;
  brandConsistency: boolean;
  hiddenUrls: boolean;
  keysCheck: boolean;
  brandData: BrandConsistencyData;
  hiddenUrlsList: HiddenUrl[];
}
interface SiteCrawlFormProps {
  onSubmit: (formData: SiteCrawlFormData) => void;
  isSubmitting: boolean;
  submitStatus: SubmitStatus;
  isEditMode?: boolean;
  initialData?: SiteCrawlFormData;
}
export default function SiteCrawlForm({
  onSubmit,
  isSubmitting,
  submitStatus,
  isEditMode = false,
  initialData
}: SiteCrawlFormProps) {
  // User plan information
  const {
    planInfo,
    loading: planLoading,
    hasFeature,
    canCreateProject
  } = useUserPlan();

  // Form States
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [pageType, setPageType] = useState<CrawlType>('single');
  const [brandConsistency, setBrandConsistency] = useState<boolean>(false);
  const [hiddenUrls, setHiddenUrls] = useState<boolean>(false);
  const [keysCheck, setKeysCheck] = useState<boolean>(false);
  const [brandData, setBrandData] = useState<BrandConsistencyData>({
    companyName: '',
    phoneNumber: '',
    emailAddress: '',
    address: '',
    additionalInformation: ''
  });
  const [hiddenUrlsList, setHiddenUrlsList] = useState<HiddenUrl[]>([{
    id: '1',
    url: ''
  }]);

  // Modal states for upgrade prompts
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    title: string;
    description: string;
    featureName: string;
  }>({
    title: '',
    description: '',
    featureName: ''
  });

  // Initialize form data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setSiteUrl(initialData.siteUrl);
      setPageType(initialData.pageType);
      setBrandConsistency(initialData.brandConsistency);
      setHiddenUrls(initialData.hiddenUrls);
      setKeysCheck(initialData.keysCheck);
      setBrandData(initialData.brandData);
      setHiddenUrlsList(initialData.hiddenUrlsList);
    }
  }, [isEditMode, initialData]);

  // Reset to single page if user doesn't have full site crawl access
  useEffect(() => {
    if (planInfo && !hasFeature('full_site_crawl') && pageType === 'multiple') {
      setPageType('single');
    }
  }, [planInfo, hasFeature, pageType]);

  // Check if user can create projects based on their plan
  const canCreateNewProject = canCreateProject();
  const handleBrandDataChange = (field: keyof BrandConsistencyData, value: string): void => {
    setBrandData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const addHiddenUrl = (): void => {
    const newId = (hiddenUrlsList.length + 1).toString();
    setHiddenUrlsList(prev => [...prev, {
      id: newId,
      url: ''
    }]);
  };
  const removeHiddenUrl = (id: string): void => {
    if (hiddenUrlsList.length > 1) {
      setHiddenUrlsList(prev => prev.filter(url => url.id !== id));
    }
  };
  const updateHiddenUrl = (id: string, value: string): void => {
    setHiddenUrlsList(prev => prev.map(url => url.id === id ? {
      ...url,
      url: value
    } : url));
  };
  const handleUpgradeClick = (): void => {
    if (!hasFeature('full_site_crawl')) {
      setUpgradeModalConfig({
        title: 'Upgrade Required',
        description: 'Full site crawling is a premium feature',
        featureName: 'full_site_crawl'
      });
      setShowUpgradeModal(true);
    }
  };
  const handleProjectLimitReached = (): void => {
    setUpgradeModalConfig({
      title: 'Project Limit Reached',
      description: 'You have reached your project limit. Upgrade to create more projects.',
      featureName: 'project_limit'
    });
    setShowUpgradeModal(true);
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Check if user can create projects
    if (!canCreateNewProject) {
      handleProjectLimitReached();
      return;
    }
    onSubmit({
      siteUrl,
      pageType,
      brandConsistency,
      hiddenUrls,
      keysCheck,
      brandData,
      hiddenUrlsList
    });
  };

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

  // Show loading state while plan is being fetched
  if (planLoading) {
    return <motion.div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.4,
      ease: "easeOut"
    }}>
        {!isEditMode && <div className="px-6 py-4 border-b border-gray-200">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>}
        
        <div className="">
          <div className="space-y-6">
            {/* URL Input Skeleton */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Page Type Selection Skeleton */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Brand Consistency Skeleton */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Submit Button Skeleton */}
            <div className="pt-4">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </motion.div>;
  }

  // Show error state if plan loading failed
  if (!planInfo) {
    return <motion.div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.4,
      ease: "easeOut"
    }}>
        <div className="">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Failed to load plan information</p>
            <p className="text-gray-500 text-sm mt-1">Please refresh the page or contact support</p>
          </div>
        </div>
      </motion.div>;
  }
  return <motion.div className="bg-white p-6 border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.4,
    ease: "easeOut"
  }}>
      {!isEditMode && <div className="  ">
          <div className="pb-2">
            <h2 className="text-lg font-semibold text-black">New Site Crawl</h2>
            
          </div>
        </div>}
      
      <div className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
          <div className="flex-1 space-y-6">
          {/* URL Input */}
          <div>
          
            <input type="url" id="siteUrl" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-4 border border-gray-200 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>

          {/* Page Type Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Crawl Type
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className={`flex items-center p-4 border rounded cursor-pointer ${pageType === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="pageType" value="single" checked={pageType === 'single'} onChange={e => setPageType(e.target.value as CrawlType)} className="sr-only" />
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${pageType === 'single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                    {pageType === 'single' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-black">Single Page</span>
                    {/* {hasFeature('single_page_crawl') && (
                      <span className="block text-xs text-green-600">✓ Available</span>
                     )} */}
                  </div>
                </div>
              </label>
              <label className={`flex items-center p-4 border rounded cursor-pointer ${pageType === 'multiple' ? 'border-blue-500 bg-blue-50' : hasFeature('full_site_crawl') ? 'border-gray-200' : 'border-gray-200 bg-gray-50'} ${!hasFeature('full_site_crawl') ? 'opacity-60' : ''}`} onClick={handleUpgradeClick}>
                <input type="radio" name="pageType" value="multiple" checked={pageType === 'multiple'} onChange={e => hasFeature('full_site_crawl') && setPageType(e.target.value as CrawlType)} disabled={!hasFeature('full_site_crawl')} className="sr-only" />
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${pageType === 'multiple' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                    {pageType === 'multiple' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-black">Multiple Pages</span>
                    {!hasFeature('full_site_crawl') && <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>}
                    {/* {hasFeature('full_site_crawl') && (
                      <span className="block text-xs text-green-600">✓ Available</span>
                     )} */}
                  </div>
                </div>
              </label>
            </div>
            
            {/* Brand Consistency Checkbox */}
            <label className="flex items-center p-3 border border-gray-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={brandConsistency}
                onChange={(e) => setBrandConsistency(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-black pl-2">Brand Consistency Check</span>
            </label>
          </div>

          {/* Feature Checkboxes */}
          {/* <div>
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
           </div> */}

          {/* Brand Consistency Checkbox */}
         

          {/* Brand Consistency Fields */}
          {brandConsistency && <div className="bg-blue-50 rounded-lg p-4 space-y-4 border border-blue-200">
              <h3 className="text-base font-semibold text-black">
                Brand Consistency Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-black mb-1">
                    Company Name
                  </label>
                  <input type="text" id="companyName" value={brandData.companyName} onChange={e => handleBrandDataChange('companyName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-black mb-1">
                      Phone Number
                    </label>
                    <input type="tel" id="phoneNumber" value={brandData.phoneNumber} onChange={e => handleBrandDataChange('phoneNumber', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-black mb-1">
                      Email Address
                    </label>
                    <input type="email" id="emailAddress" value={brandData.emailAddress} onChange={e => handleBrandDataChange('emailAddress', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                    Address
                  </label>
                  <input type="text" id="address" value={brandData.address} onChange={e => handleBrandDataChange('address', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="additionalInformation" className="block text-sm font-medium text-black mb-1">
                    Additional Information
                  </label>
                  <textarea id="additionalInformation" value={brandData.additionalInformation} onChange={e => handleBrandDataChange('additionalInformation', e.target.value)} rows={3} className="w-full px-3 py-2 text-black border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            </div>}

          {/* Hidden URLs Fields */}
          {hiddenUrls && <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-black">
                  Hidden URLs
                </h3>
                <button type="button" onClick={addHiddenUrl} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded cursor-pointer">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add URL
                </button>
              </div>
              <div className="space-y-3">
                {hiddenUrlsList.map(hiddenUrl => <div key={hiddenUrl.id} className="flex items-center space-x-2">
                    <input type="url" value={hiddenUrl.url} onChange={e => updateHiddenUrl(hiddenUrl.id, e.target.value)} placeholder="https://example.com/hidden-page" className="flex-1 px-3 py-2 text-black border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    {hiddenUrlsList.length > 1 && <button type="button" onClick={() => removeHiddenUrl(hiddenUrl.id)} className="p-2 text-gray-600 rounded cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>}
                  </div>)}
              </div>
            </div>}

          {/* Plan Information */}
          {/* {planInfo && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Current Plan: {planInfo.plan_name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {planInfo.current_projects} / {planInfo.max_projects === -1 ? 'Unlimited' : planInfo.max_projects} projects used
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  planInfo.plan_type === 'Starter' 
                    ? 'bg-green-100 text-green-700' 
                    : planInfo.plan_type === 'Growth' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {planInfo.plan_type}
                </div>
              </div>
            </div>
           )} */}

          </div>
          {/* Submit Button */}
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting || !canCreateNewProject} className={`w-full py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${!canCreateNewProject ? 'bg-gray-400 text-white cursor-not-allowed' : submitStatus === 'success' ? 'bg-green-600 text-white' : submitStatus === 'error' ? 'bg-red-600 text-white' : isSubmitting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white'}`}>
              <span className="flex items-center justify-center">
                {submitStatus === 'success' ? <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Project Created Successfully!
                  </> : submitStatus === 'error' ? <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Error - Try Again
                  </> : isSubmitting ? <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating Project...' : 'Creating Project...'}
                  </> : !canCreateNewProject ? <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Project Limit Reached - Upgrade Required
                  </> : <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isEditMode ? 'Update Project' : 'Start Site Crawl'}
                  </>}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title={upgradeModalConfig.title} description={upgradeModalConfig.description} featureName={upgradeModalConfig.featureName} currentPlan={planInfo ? {
      name: planInfo.plan_name,
      type: planInfo.plan_type,
      maxProjects: planInfo.max_projects,
      currentProjects: planInfo.current_projects
    } : undefined} />
    </motion.div>;
}