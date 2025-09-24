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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(40)

  

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

  // Helper function to parse fullTag HTML and extract image attributes
  const parseImageFromFullTag = (fullTag: string) => {
    try {
      // Create a temporary DOM element to parse the fullTag
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = fullTag
      const imgElement = tempDiv.querySelector('img')
      
      if (!imgElement) {
        return null
      }
      
      // Extract all relevant attributes
      const src = imgElement.src || imgElement.getAttribute('src') || ''
      const alt = imgElement.alt || imgElement.getAttribute('alt') || null
      const title = imgElement.title || imgElement.getAttribute('title') || null
      const width = imgElement.width || imgElement.getAttribute('width') || null
      const height = imgElement.height || imgElement.getAttribute('height') || null
      const className = imgElement.className || imgElement.getAttribute('class') || null
      const loading = imgElement.loading || imgElement.getAttribute('loading') || null
      const decoding = imgElement.getAttribute('decoding') || null
      
      return {
        src,
        alt,
        title,
        width: width ? parseInt(width.toString()) : null,
        height: height ? parseInt(height.toString()) : null,
        className,
        loading,
        decoding
      }
    } catch (error) {
      console.warn('❌ Error parsing fullTag:', error)
      return null
    }
  }

  // Extract images from original scraping data or HTML content
  const images = useMemo(() => {
    
    
    
    
    
    const allImages: ImageData[] = []
    
    // First, try to extract from original scraping data
    if (originalScrapingData?.pages && Array.isArray(originalScrapingData.pages)) {
      
      
      originalScrapingData.pages.forEach((page: any, pageIndex: number) => {
        
        
        if (page.images && Array.isArray(page.images)) {
          
          
          page.images.forEach((img: any, imgIndex: number) => {
            let src = img.src || img.url || ''
            let alt = img.alt || img.altText || img.alt_text || null
            let title = img.title || img.titleText || img.title_text || null
            let width = img.width || undefined
            let height = img.height || undefined
            
            // If we have fullTag, parse it to extract more accurate data
            if (img.fullTag) {
              
              
              const parsedData = parseImageFromFullTag(img.fullTag)
              if (parsedData) {
                
                
                // Use parsed values if available, fallback to original values
                if (parsedData.src) src = parsedData.src
                if (parsedData.alt !== null) alt = parsedData.alt
                if (parsedData.title !== null) title = parsedData.title
                if (parsedData.width !== null) width = parsedData.width
                if (parsedData.height !== null) height = parsedData.height
              }
            }
            
            
            
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
              
              
              
              allImages.push({
                url: absoluteUrl,
                alt: alt,
                title: title,
                width: width,
                height: height,
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
      
      
      scrapedPages.forEach((page: any, pageIndex: number) => {
        
        
        
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
            
            
            
            imgElements.forEach((img: HTMLImageElement, imgIndex: number) => {
              const src = img.src || img.getAttribute('src') || ''
              const alt = img.alt || img.getAttribute('alt') || null
              const title = img.title || img.getAttribute('title') || null
              
              
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
                
                
                
                allImages.push({
                  url: absoluteUrl,
                  alt: alt,
                  title: title,
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
          
        }
      })
    }
    
    
    
    
    // Debug: Log images with and without alt text
    const withAlt = allImages.filter(img => img.alt && img.alt.trim() !== '')
    const withoutAlt = allImages.filter(img => !img.alt || img.alt.trim() === '')
    
    
    
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
      const hasAltText = img.alt && img.alt.trim() !== ''
      const matchesAlt = altFilter === 'all' || 
        (altFilter === 'with-alt' && hasAltText) ||
        (altFilter === 'without-alt' && !hasAltText)

      // Type filter
      const matchesType = typeFilter === 'all' || img.type === typeFilter

      return matchesSearch && matchesAlt && matchesType
    })
  }, [images, searchTerm, altFilter, typeFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedImages = filteredImages.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleFilterChange = (newSearchTerm: string, newAltFilter: 'all' | 'with-alt' | 'without-alt', newTypeFilter: string) => {
    setSearchTerm(newSearchTerm)
    setAltFilter(newAltFilter)
    setTypeFilter(newTypeFilter)
    setCurrentPage(1)
  }

  const imageTypes = useMemo(() => {
    const types = [...new Set(images.map(img => img.type).filter(Boolean))]
    return types.sort()
  }, [images])

  const stats = useMemo(() => {
    const total = images.length
    const withAlt = images.filter(img => img.alt && img.alt.trim() !== '').length
    const withoutAlt = total - withAlt
    
    return { total, withAlt, withoutAlt }
  }, [images])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Images Analysis</h3>
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredImages.length)} of {filteredImages.length} images
          {filteredImages.length !== stats.total && ` (${stats.total} total)`}
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
            onChange={(e) => handleFilterChange(e.target.value, altFilter, typeFilter)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Alt Text Filter */}
        <div className="w-40">
          <select
            value={altFilter}
            onChange={(e) => handleFilterChange(searchTerm, e.target.value as any, typeFilter)}
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
            onChange={(e) => handleFilterChange(searchTerm, altFilter, e.target.value)}
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
              {paginatedImages.map((img, index) => (
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
                      {img.alt && img.alt.trim() !== '' ? (
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

      {/* Pagination Controls */}
      {filteredImages.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
