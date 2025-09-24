'use client'

import { useEffect, useState } from 'react'
import { AuditProject } from '@/types/audit'

interface SocialPreviewTabProps {
  project: AuditProject
  scrapedPages: any[]
}

interface SocialPreview {
  platform: string
  title: string
  description: string
  image: string | null
  url: string
  status: 'good' | 'warning' | 'error'
  issues: string[]
}

export default function SocialPreviewTab({ project, scrapedPages }: SocialPreviewTabProps) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('facebook')

  useEffect(() => {
   console.log('scrapedPages', scrapedPages)
  }, [scrapedPages])

  // Extract social media data from scraped pages
  const extractSocialPreviews = (pageIndex: number = 0): SocialPreview[] => {
    if (!scrapedPages || scrapedPages.length === 0) {
      return []
    }

    // Get the selected page or first page for social preview
    const targetPage = selectedPage 
      ? scrapedPages.find(page => page.url === selectedPage) || scrapedPages[0]
      : scrapedPages[pageIndex]
    
    if (!targetPage) return []

    const socialMetaTags = targetPage.social_meta_tags
    const pageTitle = targetPage.title || targetPage.url
    const pageDescription = targetPage.description || ''
    const pageUrl = targetPage.url || project.site_url

    const previews: SocialPreview[] = []

    // Facebook/Open Graph Preview
    const ogTitle = socialMetaTags?.openGraph?.title || pageTitle
    const ogDescription = socialMetaTags?.openGraph?.description || pageDescription
    const ogImage = socialMetaTags?.openGraph?.image
    const ogUrl = socialMetaTags?.openGraph?.url || pageUrl

    const facebookIssues: string[] = []
    if (!socialMetaTags?.openGraph?.title) facebookIssues.push('Missing og:title')
    if (!socialMetaTags?.openGraph?.description) facebookIssues.push('Missing og:description')
    if (!socialMetaTags?.openGraph?.image) facebookIssues.push('Missing og:image')
    if (!socialMetaTags?.openGraph?.url) facebookIssues.push('Missing og:url')

    previews.push({
      platform: 'Facebook',
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      url: ogUrl,
      status: facebookIssues.length === 0 ? 'good' : facebookIssues.length <= 2 ? 'warning' : 'error',
      issues: facebookIssues
    })

    // Twitter Preview
    const twitterTitle = socialMetaTags?.twitter?.title || ogTitle
    const twitterDescription = socialMetaTags?.twitter?.description || ogDescription
    const twitterImage = socialMetaTags?.twitter?.image || ogImage

    const twitterIssues: string[] = []
    if (!socialMetaTags?.twitter?.card) twitterIssues.push('Missing twitter:card')
    if (!socialMetaTags?.twitter?.title) twitterIssues.push('Missing twitter:title')
    if (!socialMetaTags?.twitter?.description) twitterIssues.push('Missing twitter:description')
    if (!socialMetaTags?.twitter?.image) twitterIssues.push('Missing twitter:image')

    previews.push({
      platform: 'Twitter',
      title: twitterTitle,
      description: twitterDescription,
      image: twitterImage,
      url: pageUrl,
      status: twitterIssues.length === 0 ? 'good' : twitterIssues.length <= 2 ? 'warning' : 'error',
      issues: twitterIssues
    })

    // LinkedIn Preview (uses Open Graph as fallback)
    const linkedinTitle = socialMetaTags?.linkedin?.title || ogTitle
    const linkedinDescription = socialMetaTags?.linkedin?.description || ogDescription
    const linkedinImage = socialMetaTags?.linkedin?.image || ogImage

    const linkedinIssues: string[] = []
    if (!socialMetaTags?.linkedin?.title && !socialMetaTags?.openGraph?.title) linkedinIssues.push('Missing LinkedIn/Open Graph title')
    if (!socialMetaTags?.linkedin?.description && !socialMetaTags?.openGraph?.description) linkedinIssues.push('Missing LinkedIn/Open Graph description')
    if (!socialMetaTags?.linkedin?.image && !socialMetaTags?.openGraph?.image) linkedinIssues.push('Missing LinkedIn/Open Graph image')

    previews.push({
      platform: 'LinkedIn',
      title: linkedinTitle,
      description: linkedinDescription,
      image: linkedinImage,
      url: pageUrl,
      status: linkedinIssues.length === 0 ? 'good' : linkedinIssues.length <= 1 ? 'warning' : 'error',
      issues: linkedinIssues
    })

    // WhatsApp Preview (uses Open Graph as fallback)
    const whatsappTitle = socialMetaTags?.whatsapp?.title || ogTitle
    const whatsappDescription = socialMetaTags?.whatsapp?.description || ogDescription
    const whatsappImage = socialMetaTags?.whatsapp?.image || ogImage

    const whatsappIssues: string[] = []
    if (!socialMetaTags?.whatsapp?.title && !socialMetaTags?.openGraph?.title) whatsappIssues.push('Missing WhatsApp/Open Graph title')
    if (!socialMetaTags?.whatsapp?.description && !socialMetaTags?.openGraph?.description) whatsappIssues.push('Missing WhatsApp/Open Graph description')
    if (!socialMetaTags?.whatsapp?.image && !socialMetaTags?.openGraph?.image) whatsappIssues.push('Missing WhatsApp/Open Graph image')

    previews.push({
      platform: 'WhatsApp',
      title: whatsappTitle,
      description: whatsappDescription,
      image: whatsappImage,
      url: pageUrl,
      status: whatsappIssues.length === 0 ? 'good' : whatsappIssues.length <= 1 ? 'warning' : 'error',
      issues: whatsappIssues
    })

    return previews
  }

  const socialPreviews = extractSocialPreviews()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Social Media Preview</h4>
            <p className="text-sm text-blue-700 mt-1">
              See how your website pages appear when shared on different social media platforms.
            </p>
          </div>
        </div>
      </div>

      {/* Page Selection */}
      {scrapedPages && scrapedPages.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Select Page to Preview</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scrapedPages.map((page, index) => (
              <button
                key={index}
                onClick={() => setSelectedPage(page.url)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  selectedPage === page.url
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h6 className="text-sm font-medium text-gray-900 truncate">
                      {page.title || `Page ${index + 1}`}
                    </h6>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {page.url}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-xs text-gray-400">
                        {page.meta_tags_count || 0} meta tags
                      </span>
                      {page.social_meta_tags && (
                        <span className="text-xs text-green-600">
                          ✓ Social tags
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedPage === page.url && (
                    <svg className="w-4 h-4 text-blue-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Page Info */}
      {selectedPage && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">
                {scrapedPages.find(page => page.url === selectedPage)?.title || 'Selected Page'}
              </h5>
              <p className="text-xs text-gray-500 mt-1">
                {selectedPage}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {socialPreviews.filter(preview => preview.status === 'good').length} Good
              </div>
              <div className="text-sm font-medium text-yellow-600">
                {socialPreviews.filter(preview => preview.status === 'warning').length} Warning
              </div>
              <div className="text-sm font-medium text-red-600">
                {socialPreviews.filter(preview => preview.status === 'error').length} Issues
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-700">Platform Previews</h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className="text-sm font-medium text-green-600">
              {socialPreviews.filter(preview => preview.status === 'good').length} Good
            </span>
            <span className="text-sm font-medium text-yellow-600">
              {socialPreviews.filter(preview => preview.status === 'warning').length} Warning
            </span>
            <span className="text-sm font-medium text-red-600">
              {socialPreviews.filter(preview => preview.status === 'error').length} Issues
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {socialPreviews.map((preview, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">{preview.platform}</h5>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(preview.status)}`}>
                    {getStatusIcon(preview.status)}
                    <span className="ml-1">{preview.status.toUpperCase()}</span>
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <h6 className="font-medium text-gray-900 text-sm line-clamp-2">{preview.title}</h6>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{preview.description}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="aspect-video bg-gray-200 rounded overflow-hidden">
                      {preview.image ? (
                        <img 
                          src={preview.image} 
                          alt={`${preview.platform} preview`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-gray-500 ${preview.image ? 'hidden' : ''}`}>
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs">No image available</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">URL:</span> 
                    <span className="ml-1 break-all">{preview.url}</span>
                  </div>

                  {preview.issues.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Issues Found:</h6>
                      <ul className="space-y-1">
                        {preview.issues.map((issue, issueIndex) => (
                          <li key={issueIndex} className="text-xs text-red-600 flex items-start">
                            <svg className="w-3 h-3 mt-0.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-2">Optimization Tips</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Open Graph tags:</strong> Add og:title, og:description, og:image, and og:url for Facebook and LinkedIn</li>
          <li>• <strong>Twitter Cards:</strong> Include twitter:card, twitter:title, twitter:description, and twitter:image</li>
          <li>• <strong>Image dimensions:</strong> Use 1200x630px for optimal display across all platforms</li>
          <li>• <strong>Title length:</strong> Keep under 60 characters to avoid truncation</li>
          <li>• <strong>Description length:</strong> Aim for 150-160 characters for best results</li>
          <li>• <strong>Image format:</strong> Use JPG or PNG with good compression</li>
          <li>• <strong>URL structure:</strong> Use clean, descriptive URLs for better sharing</li>
        </ul>
      </div>

      {socialPreviews.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {scrapedPages && scrapedPages.length > 0 ? 'Select a Page to Preview' : 'No Social Preview Data'}
          </h3>
          <p className="text-gray-600 mb-4">
            {scrapedPages && scrapedPages.length > 0 
              ? 'Choose a page from the list above to see its social media preview.'
              : 'Social media preview data will appear here once the website scraping is completed.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
