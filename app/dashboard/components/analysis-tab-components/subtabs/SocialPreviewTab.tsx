import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { AuditProject } from '@/types/audit'

interface SocialMetaData {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  site_name?: string
}

interface MetaTag {
  property?: string
  name?: string
  content?: string
}

interface MetaTagsData {
  all_meta_tags?: MetaTag[]
}

interface SocialData {
  openGraph: SocialMetaData
  twitter: SocialMetaData
  presentTags: string[]
  missingTags: string[]
}

interface SocialPreviewTabProps {
  project: AuditProject
}

export default function SocialPreviewTab({ project }: SocialPreviewTabProps) {
  const [socialData, setSocialData] = useState<SocialData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Extract social meta tags from meta_tags_data
  const extractSocialMetaTags = (metaTagsData: MetaTagsData): SocialData => {
    if (!metaTagsData?.all_meta_tags) {
      return {
        openGraph: {},
        twitter: {},
        presentTags: [],
        missingTags: []
      }
    }

    const openGraph: SocialMetaData = {}
    const twitter: SocialMetaData = {}
    const presentTags: string[] = []
    const missingTags: string[] = []

    // Define expected tags
    const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name']
    const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:url', 'twitter:site', 'twitter:creator']

    // Extract tags from all_meta_tags array
    metaTagsData.all_meta_tags.forEach((tag: MetaTag) => {
      // Handle Open Graph tags (using property field)
      if (tag.property?.startsWith('og:')) {
        const key = tag.property.replace('og:', '')
        openGraph[key as keyof SocialMetaData] = tag.content
        presentTags.push(tag.property)
      }
      // Handle Twitter tags (using name field)
      if (tag.name?.startsWith('twitter:')) {
        const key = tag.name.replace('twitter:', '')
        twitter[key as keyof SocialMetaData] = tag.content
        presentTags.push(tag.name)
      }
    })

    // Check for missing Open Graph tags
    ogTags.forEach(tag => {
      if (!presentTags.includes(tag)) {
        missingTags.push(tag)
      }
    })

    // Check for missing Twitter tags
    twitterTags.forEach(tag => {
      if (!presentTags.includes(tag)) {
        missingTags.push(tag)
      }
    })

    return { openGraph, twitter, presentTags, missingTags }
  }

  // Effect to update social data when project changes
  useEffect(() => {
    if (project?.meta_tags_data) {
      const extracted = extractSocialMetaTags(project.meta_tags_data)
      setSocialData(extracted)
      setIsLoading(false)
    } else {
      setSocialData({
        openGraph: {},
        twitter: {},
        presentTags: [],
        missingTags: []
      })
      setIsLoading(false)
    }
  }, [project?.meta_tags_data, project?.id])

  // Use extracted data or fallback
  const { openGraph, twitter, presentTags, missingTags } = socialData || {
    openGraph: {},
    twitter: {},
    presentTags: [],
    missingTags: []
  }

  // Get the social preview data
  const socialTitle = openGraph.title || twitter.title || 'No title available'
  const socialDescription = openGraph.description || twitter.description || 'No description available'
  const socialImage = openGraph.image || twitter.image
  const socialUrl = openGraph.url || project.site_url

  // Count present and missing tags
  const openGraphPresent = presentTags.filter((tag: string) => tag.startsWith('og:')).length
  const twitterPresent = presentTags.filter((tag: string) => tag.startsWith('twitter:')).length
  const openGraphMissing = missingTags.filter((tag: string) => tag.startsWith('og:')).length
  const twitterMissing = missingTags.filter((tag: string) => tag.startsWith('twitter:')).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Social Preview Mockup */}
      <div className="bg-white rounded-lg  border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Preview</h3>
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex gap-4">
            {/* Image placeholder */}
            <div className="w-32 h-32 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center relative">
              {socialImage ? (
                <>
                  <Image 
                    src={socialImage} 
                    alt="Social preview" 
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden text-gray-400 text-xs text-center">
                    Image not found
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs text-center">
                  No image
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                {socialTitle}
              </h4>
              <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                {socialDescription}
              </p>
              <a 
                href={socialUrl} 
                className="text-blue-600 text-xs hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {socialUrl}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {socialImage && (
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Image</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Image 
                src={socialImage} 
                alt="Social media preview" 
                width={128}
                height={128}
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.classList.remove('hidden')
                }}
              />
              <div className="hidden w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 items-center justify-center">
                <span className="text-gray-400 text-sm">Image not found</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Image URL:</p>
                <a 
                  href={socialImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline break-all"
                >
                  {socialImage}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg  border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Open Graph meta tags present: {openGraphPresent > 0 ? Object.keys(openGraph).filter((key: string) => openGraph[key as keyof SocialMetaData]).join(', ') : 'none'}
          </p>
          <p className="text-sm text-gray-600">
            Twitter meta tags present: {twitterPresent > 0 ? Object.keys(twitter).filter((key: string) => twitter[key as keyof SocialMetaData]).join(', ') : 'none'}
          </p>
        </div>
      </div>

      {/* Twitter and Open Graph Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Twitter Section */}
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Twitter</h3>
            {twitterPresent > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                Present
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
              <div className="space-y-1">
                {Object.entries(twitter).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="ml-2 text-gray-900">{String(value)}</span>
                  </div>
                ))}
                {Object.keys(twitter).length === 0 && (
                  <p className="text-sm text-gray-500">No Twitter tags found</p>
                )}
              </div>
            </div>

            {twitterMissing > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">Missing Tags:</h4>
                <div className="space-y-1">
                  {missingTags
                    .filter((tag: string) => tag.startsWith('twitter:'))
                    .map((tag: string) => (
                      <div key={tag} className="text-sm text-red-600">
                        {tag}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Open Graph Section */}
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Open Graph</h3>
            {openGraphPresent > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                Present
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
              <div className="space-y-1">
                {Object.entries(openGraph).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="ml-2 text-gray-900 break-all">{String(value)}</span>
                  </div>
                ))}
                {Object.keys(openGraph).length === 0 && (
                  <p className="text-sm text-gray-500">No Open Graph tags found</p>
                )}
              </div>
            </div>

            {openGraphMissing > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">Missing Tags:</h4>
                <div className="space-y-1">
                  {missingTags
                    .filter((tag: string) => tag.startsWith('og:'))
                    .map((tag: string) => (
                      <div key={tag} className="text-sm text-red-600">
                        {tag}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
