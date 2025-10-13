'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { AuditProject } from '@/types/audit'
import { ScrapedPage } from '../analysis-tab/types'

// Override the ScrapedPage type to accept any performance_analysis type
interface ScrapedPageOverride extends Omit<ScrapedPage, 'performance_analysis'> {
  performance_analysis?: Record<string, unknown>
}

interface OriginalScrapingData {
  pages?: ScrapedPageOverride[]
}

interface ImagesSectionProps {
  project: AuditProject
  scrapedPages: ScrapedPageOverride[]
  originalScrapingData?: OriginalScrapingData
}

interface ImageData {
  url?: string
  src?: string
  alt?: string | null
  title?: string | null
  width?: number
  height?: number
  type?: string
  size?: number
  page_url?: string
  altText?: string
  alt_text?: string
  titleText?: string
  title_text?: string
  fullTag?: string
  isBroken?: boolean
  loadError?: boolean
}

export default function ImagesSection({ project, scrapedPages, originalScrapingData }: ImagesSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Reduced from 40 to 20 for better performance
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filter states
  const [selectedImageType, setSelectedImageType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  

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
      case 'bmp':
        return 'BMP'
      case 'ico':
        return 'ICO'
      case 'tiff':
        return 'TIFF'
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
    setIsProcessing(true)
    const allImages: ImageData[] = []
    
    // First, try to extract from original scraping data
    if (originalScrapingData?.pages && Array.isArray(originalScrapingData.pages)) {
      
      
      originalScrapingData.pages.forEach((page: ScrapedPageOverride) => {
        
        
        if (page.images && Array.isArray(page.images)) {
          
          
          page.images.forEach((img: ImageData) => {
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
              // Filter out localhost URLs
              if (src.includes('localhost') || src.includes('127.0.0.1')) {
                return
              }
              
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
              
              // Convert HTTP to HTTPS
              if (absoluteUrl.startsWith('http://')) {
                absoluteUrl = absoluteUrl.replace('http://', 'https://')
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
      
      
      scrapedPages.forEach((page: ScrapedPageOverride) => {
        
        
        
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
            
            
            
            imgElements.forEach((img: HTMLImageElement) => {
              const src = img.src || img.getAttribute('src') || ''
              const alt = img.alt || img.getAttribute('alt') || null
              const title = img.title || img.getAttribute('title') || null
              
              
              if (src) {
                // Filter out localhost URLs
                if (src.includes('localhost') || src.includes('127.0.0.1')) {
                  return
                }
                
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
                
                // Convert HTTP to HTTPS
                if (absoluteUrl.startsWith('http://')) {
                  absoluteUrl = absoluteUrl.replace('http://', 'https://')
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
    // const withAlt = allImages.filter(img => img.alt && img.alt.trim() !== '')
    // const withoutAlt = allImages.filter(img => !img.alt || img.alt.trim() === '')
    
    setIsProcessing(false)
    return allImages
  }, [scrapedPages, project.site_url, originalScrapingData])

  // Filter images based on selected criteria
  const filteredImages = useMemo(() => {
    let filtered = [...images]

    // Filter by image type
    if (selectedImageType !== 'all') {
      filtered = filtered.filter(img => img.type === selectedImageType)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(img => 
        img.url?.toLowerCase().includes(query) ||
        img.alt?.toLowerCase().includes(query) ||
        img.title?.toLowerCase().includes(query) ||
        img.page_url?.toLowerCase().includes(query)
      )
    }


    return filtered
  }, [images, selectedImageType, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedImages = filteredImages.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedImageType, searchQuery])

  const stats = useMemo(() => {
    const total = images.length
    const withAlt = images.filter(img => img.alt && img.alt.trim() !== '').length
    const withoutAlt = total - withAlt
    
    return { total, withAlt, withoutAlt }
  }, [images])

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
  }



  // Handle image click to open modal
  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image)
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedImage(null)
  }

  return (
    <div className="bg-white rounded-lg  border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Images Analysis</h3>
        <div className="text-sm text-gray-500">
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              Processing images...
            </span>
          ) : (
            <>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredImages.length)} of {filteredImages.length} images
              {filteredImages.length !== stats.total && ` (${stats.total} total)`}
            </>
          )}
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

      {/* Filter Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Images</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by URL, alt text, title, or page..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Image Type Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Type</label>
            <select
              value={selectedImageType}
              onChange={(e) => setSelectedImageType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="JPEG">JPEG</option>
              <option value="PNG">PNG</option>
              <option value="GIF">GIF</option>
              <option value="WebP">WebP</option>
              <option value="SVG">SVG</option>
              <option value="BMP">BMP</option>
              <option value="ICO">ICO</option>
              <option value="TIFF">TIFF</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>


        </div>

        {/* Clear Filters */}
        {(selectedImageType !== 'all' || searchQuery) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setSelectedImageType('all')
                setSearchQuery('')
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
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
                    <div 
                      className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleImageClick(img)}
                    >
                      <Image
                        src={img.url || img.src || ''}
                        alt={img.alt || 'No alt text'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Failed to load</div>'
                          }
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

      {/* Image Modal */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden border border-gray-300 ">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Image Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Large Image */}
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                    <Image
                      src={selectedImage.url || selectedImage.src || ''}
                      alt={selectedImage.alt || 'No alt text'}
                      width={400}
                      height={400}
                      className="max-w-full max-h-[400px] object-contain rounded-lg "
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="text-center text-gray-400">Failed to load image</div>'
                        }
                      }}
                    />
                  </div>
                  
                  {/* Image Actions */}
                  <div className="flex gap-2">
                    <a
                      href={selectedImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      Open in New Tab
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedImage.url || selectedImage.src || '')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>

                {/* Image Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Image Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">URL:</label>
                        <p className="text-sm text-gray-900 break-all mt-1">{selectedImage.url}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Alt Text:</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedImage.alt && selectedImage.alt.trim() !== '' ? selectedImage.alt : 'No alt text provided'}
                        </p>
                      </div>
                      
                      {selectedImage.title && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Title:</label>
                          <p className="text-sm text-gray-900 mt-1">{selectedImage.title}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Type:</label>
                          <p className="text-sm text-gray-900 mt-1">{selectedImage.type || 'Unknown'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Dimensions:</label>
                          <p className="text-sm text-gray-900 mt-1">
                            {selectedImage.width && selectedImage.height 
                              ? `${selectedImage.width} × ${selectedImage.height}` 
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {selectedImage.page_url && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Found on Page:</label>
                          <a
                            href={selectedImage.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all block mt-1"
                          >
                            {selectedImage.page_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accessibility Check */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Accessibility</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedImage.alt && selectedImage.alt.trim() !== '' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Has Alt Text
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✗ Missing Alt Text
                          </span>
                        )}
                      </div>
                      
                      {selectedImage.alt && selectedImage.alt.trim() !== '' && (
                        <div className="text-sm text-gray-600">
                          <strong>Alt Text:</strong> &quot;{selectedImage.alt}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
