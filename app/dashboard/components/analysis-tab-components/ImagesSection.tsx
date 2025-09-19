'use client'

import { useState, useMemo } from 'react'
import { AuditProject } from '@/types/audit'

interface ImagesSectionProps {
  project: AuditProject
  scrapedPages: any[]
  originalScrapingData?: any
}

interface ImageData {
  url: string
  alt: string | null
  title: string | null
  width?: number
  height?: number
  type?: string
  size?: number
  page_url?: string
}

export default function ImagesSection({ project, scrapedPages, originalScrapingData }: ImagesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [altFilter, setAltFilter] = useState<'all' | 'with-alt' | 'without-alt'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  console.log('🖼️ ImagesSection rendered with:', { 
    project: !!project, 
    projectSiteUrl: project?.site_url,
    scrapedPagesCount: scrapedPages?.length || 0,
    scrapedPages: scrapedPages
  })

  const getImageType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'JPEG'
      case 'png':
        return 'PNG'
      case 'gif':
        return 'GIF'
      case 'webp':
        return 'WebP'
      case 'svg':
        return 'SVG'
      default:
        return 'Unknown'
    }
  }

  // Extract images from original scraping data or HTML content
  const images = useMemo(() => {
    console.log('🖼️ ImagesSection - Starting image extraction')
    console.log('📊 scrapedPages:', scrapedPages)
    console.log('🌐 project.site_url:', project.site_url)
    console.log('🔍 originalScrapingData:', originalScrapingData)
    
    const allImages: ImageData[] = []
    
    // First, try to extract from original scraping data
    if (originalScrapingData?.pages && Array.isArray(originalScrapingData.pages)) {
      console.log('📊 Using original scraping data for image extraction')
      
      originalScrapingData.pages.forEach((page: any, pageIndex: number) => {
        console.log(`📄 Processing page ${pageIndex + 1} from scraping data:`, page.url)
        
        if (page.images && Array.isArray(page.images)) {
          console.log(`🖼️ Found ${page.images.length} images in scraping data for page ${pageIndex + 1}`)
          
          page.images.forEach((img: any, imgIndex: number) => {
            const src = img.src || img.url || ''
            console.log(`🖼️ Image ${imgIndex + 1} from scraping data:`, { src, alt: img.alt, title: img.title })
            
            if (src) {
              // Convert relative URLs to absolute
              let absoluteUrl = src
              if (!src.startsWith('http')) {
                const baseUrl = project.site_url || 'https://example.com'
                if (src.startsWith('/')) {
                  absoluteUrl = `${baseUrl}${src}`
                } else {
                  absoluteUrl = `${baseUrl}/${src}`
                }
              }
              
              console.log('🔗 Image URL conversion from scraping data:', { src, absoluteUrl, page: page.url })
              
              allImages.push({
                url: absoluteUrl,
                alt: img.alt || null,
                title: img.title || null,
                width: img.width || undefined,
                height: img.height || undefined,
                type: getImageType(src),
                page_url: page.url
              })
            }
          })
        }
      })
    }
    
    // If no images found in scraping data, fall back to HTML parsing
    if (allImages.length === 0 && scrapedPages && scrapedPages.length > 0) {
      console.log('📊 No images in scraping data, falling back to HTML parsing')
      
      scrapedPages.forEach((page: any, pageIndex: number) => {
        console.log(`📄 Processing page ${pageIndex + 1} from HTML:`, page.url)
        console.log('📝 HTML content length:', page.html_content?.length || 0)
        
        if (page.html_content) {
          try {
            // Create a temporary DOM parser to extract images
            if (typeof DOMParser === 'undefined') {
              console.warn('DOMParser not available in this environment')
              return
            }
            const parser = new DOMParser()
            const doc = parser.parseFromString(page.html_content, 'text/html')
            const imgElements = doc.querySelectorAll('img')
            
            console.log(`🖼️ Found ${imgElements.length} img elements in HTML for page ${pageIndex + 1}`)
            
            imgElements.forEach((img: HTMLImageElement, imgIndex: number) => {
              const src = img.src || img.getAttribute('src') || ''
              console.log(`🖼️ Image ${imgIndex + 1} from HTML:`, { src, alt: img.alt, title: img.title })
              
              if (src) {
                // Convert relative URLs to absolute
                let absoluteUrl = src
                if (!src.startsWith('http')) {
                  const baseUrl = project.site_url || 'https://example.com'
                  if (src.startsWith('/')) {
                    absoluteUrl = `${baseUrl}${src}`
                  } else {
                    absoluteUrl = `${baseUrl}/${src}`
                  }
                }
                
                console.log('🔗 Image URL conversion from HTML:', { src, absoluteUrl, page: page.url })
                
                allImages.push({
                  url: absoluteUrl,
                  alt: img.alt || null,
                  title: img.title || null,
                  width: img.width || undefined,
                  height: img.height || undefined,
                  type: getImageType(src),
                  page_url: page.url
                })
              }
            })
          } catch (error) {
            console.warn('❌ Error parsing HTML for images:', error)
          }
        } else {
          console.log('❌ No HTML content for page:', page.url)
        }
      })
    }
    
    console.log('✅ Total images extracted:', allImages.length)
    console.log('🖼️ All images:', allImages)
    return allImages
  }, [scrapedPages, project.site_url, originalScrapingData])

  const filteredImages = useMemo(() => {
    return images.filter(img => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        img.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (img.alt && img.alt.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (img.title && img.title.toLowerCase().includes(searchTerm.toLowerCase()))

      // Alt text filter
      const matchesAlt = altFilter === 'all' || 
        (altFilter === 'with-alt' && img.alt) ||
        (altFilter === 'without-alt' && !img.alt)

      // Type filter
      const matchesType = typeFilter === 'all' || img.type === typeFilter

      return matchesSearch && matchesAlt && matchesType
    })
  }, [images, searchTerm, altFilter, typeFilter])

  const imageTypes = useMemo(() => {
    const types = [...new Set(images.map(img => img.type).filter(Boolean))]
    return types.sort()
  }, [images])

  const stats = useMemo(() => {
    const total = images.length
    const withAlt = images.filter(img => img.alt).length
    const withoutAlt = total - withAlt
    
    return { total, withAlt, withoutAlt }
  }, [images])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Images Analysis</h3>
        <div className="text-sm text-gray-500">
          {filteredImages.length} of {stats.total} images
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Images</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.withAlt}</div>
          <div className="text-sm text-gray-600">With Alt Text</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.withoutAlt}</div>
          <div className="text-sm text-gray-600">Without Alt Text</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end gap-3 mb-6">
        {/* Search */}
        <div className="w-48">
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Alt Text Filter */}
        <div className="w-40">
          <select
            value={altFilter}
            onChange={(e) => setAltFilter(e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="all">All Images</option>
            <option value="with-alt">With Alt Text</option>
            <option value="without-alt">Without Alt Text</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-32">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="all">All Types</option>
            {imageTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Images Table */}
      {filteredImages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alt Text
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredImages.map((img, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.alt || 'No alt text'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Failed to load</div>'
                          }
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', img.url)
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate">
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {img.url}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {img.alt ? (
                        <span className="text-sm text-gray-900">{img.alt}</span>
                      ) : (
                        <span className="text-sm text-gray-500 italic">No alt text</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-900 rounded-full">
                      {img.type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {img.width && img.height ? `${img.width}×${img.height}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate">
                      <a
                        href={img.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {img.page_url}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No images found matching your filters</p>
        </div>
      )}
    </div>
  )
}
