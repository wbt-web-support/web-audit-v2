'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { AuditProject } from '@/types/audit'
import { ScrapedPage } from '../analysis-tab/types'
import { useSupabase } from '@/contexts/SupabaseContext'
import { supabase } from '@/lib/supabase-client'
import { useUserPlan } from '@/hooks/useUserPlan'

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
  extra_metadata?: {
    id?: string
    scraped_page_id?: string
    audit_project_id?: string
    size_bytes?: number | null
    scan_results?: any
    open_web_ninja_data?: any
    created_at?: string
    updated_at?: string
  }
}

export default function ImagesSection({ project, scrapedPages, originalScrapingData }: ImagesSectionProps) {
  const { getScrapedImages } = useSupabase()
  const { hasFeature, planInfo } = useUserPlan()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Reduced from 40 to 20 for better performance
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [scrapedImagesData, setScrapedImagesData] = useState<any[]>([])
  const [scanningImages, setScanningImages] = useState<Set<string>>(new Set())
  const [showActionsTooltip, setShowActionsTooltip] = useState(false)
  const [scanResults, setScanResults] = useState<Record<string, any>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Check if user has image scan feature
  const hasImageScanFeature = hasFeature('Image_scane')
  
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

  // Fetch images from scraped_images table
  useEffect(() => {
    const fetchImages = async () => {
      if (!project?.id) return
      
      setIsLoading(true)
      try {
        const { data, error } = await getScrapedImages(project.id)
        
        if (error) {
          console.error('❌ Error fetching scraped images:', error)
          // Fall back to parsing from scraped_pages if database fetch fails
          setScrapedImagesData([])
        } else {
          setScrapedImagesData(data || [])
          
          // Load existing scan results from database into state
          if (data && data.length > 0) {
            const existingResults: Record<string, any> = {}
            data.forEach((img: any) => {
              if (img.open_web_ninja_data) {
                // Use the same key generation logic as in rendering
                // Priority: img.id (database ID), then original_url, then empty string
                const uniqueKey = img.id || img.original_url || ''
                if (uniqueKey) {
                  existingResults[uniqueKey] = img.open_web_ninja_data
                }
              }
            })
            
            if (Object.keys(existingResults).length > 0) {
              setScanResults(prev => ({
                ...prev,
                ...existingResults
              }))
              console.log('✅ Loaded existing scan results from database:', Object.keys(existingResults).length, Object.keys(existingResults))
            }
          }
        }
      } catch (err) {
        console.error('❌ Exception fetching scraped images:', err)
        setScrapedImagesData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [project?.id, getScrapedImages])

  // Convert scraped_images data to ImageData format
  const images = useMemo(() => {
    setIsProcessing(true)
    const allImages: ImageData[] = []
    
    // First, try to use images from scraped_images table
    if (scrapedImagesData && scrapedImagesData.length > 0) {
      scrapedImagesData.forEach((img: any) => {
        const src = img.original_url || ''
        const alt = img.alt_text || null
        const title = img.title_text || null
        const width = img.width || undefined
        const height = img.height || undefined
        const type = img.type || getImageType(src)
        const pageUrl = img.scraped_pages?.url || ''
        
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
          
          // Note: Existing scan data is now loaded in useEffect above
          // This avoids setting state inside useMemo
          
          allImages.push({
            url: absoluteUrl,
            src: absoluteUrl,
            alt: alt,
            alt_text: alt,
            title: title,
            title_text: title,
            width: width,
            height: height,
            type: type,
            page_url: pageUrl,
            // Store the full scraped image record for future actions
            extra_metadata: {
              id: img.id,
              scraped_page_id: img.scraped_page_id,
              audit_project_id: img.audit_project_id,
              size_bytes: img.size_bytes,
              scan_results: img.scan_results,
              open_web_ninja_data: img.open_web_ninja_data,
              created_at: img.created_at,
              updated_at: img.updated_at
            }
          })
        }
      })
    }
    
    // Fallback: If no images from database, try to extract from original scraping data
    if (allImages.length === 0 && originalScrapingData?.pages && Array.isArray(originalScrapingData.pages)) {
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
    
    // Final fallback: Parse from HTML content
    if (allImages.length === 0 && scrapedPages && scrapedPages.length > 0) {
      scrapedPages.forEach((page: ScrapedPageOverride) => {
        if (page.html_content) {
          try {
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
        }
      })
    }
    
    setIsProcessing(false)
    return allImages
  }, [scrapedImagesData, scrapedPages, project.site_url, originalScrapingData])

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

  // Handle image scanning
  const handleScanImage = async (e: React.MouseEvent, image: ImageData) => {
    e.stopPropagation() // Prevent event bubbling
    e.preventDefault() // Prevent any default behavior
    
    // Check if user has access to image scan feature
    if (!hasImageScanFeature) {
      alert('Reverse Image Search is not available in your current plan. Please upgrade to access this feature.')
      return
    }
    
    const imageId = image.extra_metadata?.id || image.url || ''
    const uniqueKey = image.extra_metadata?.id || image.url || ''
    
    if (!uniqueKey || !image.url) {
      console.warn('❌ Cannot scan image: missing image URL')
      return
    }

    // Log image details for debugging
    console.log('🔍 Starting image scan:', {
      imageId: image.extra_metadata?.id || 'NO_ID',
      hasDatabaseId: !!image.extra_metadata?.id,
      imageUrl: image.url?.substring(0, 50),
      scrapedPageId: image.extra_metadata?.scraped_page_id
    })

    setScanningImages(prev => new Set(prev).add(uniqueKey))
    
    try {
      // Get session token for API call
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        console.error('❌ No access token available')
        return
      }

      // Call reverse image search API
      let response: Response;
      let result: any;
      
      try {
        const requestBody = {
          imageUrl: image.url,
          imageId: image.extra_metadata?.id || null,
          limit: 20,
          safe_search: 'blur'
        }
        
        console.log('📤 Sending scan request:', {
          hasImageId: !!requestBody.imageId,
          imageId: requestBody.imageId
        })
        
        response = await fetch('/api/reverse-image-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        })

        // Try to parse JSON response
        try {
          result = await response.json()
        } catch (parseError) {
          const textResponse = await response.text()
          console.error('❌ Failed to parse JSON response:', {
            status: response.status,
            statusText: response.statusText,
            textResponse: textResponse.substring(0, 200),
            parseError
          })
          
          throw new Error(`Invalid JSON response from server: ${textResponse.substring(0, 100)}`)
        }
      } catch (fetchError) {
        console.error('❌ Network error calling reverse-image-search API:', {
          error: fetchError,
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          imageUrl: image.url?.substring(0, 50)
        })
        return
      }

      if (!response.ok || result.error) {
        console.error('❌ Error scanning image:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error || 'Unknown error',
          message: result.message || 'No error message',
          details: result.details || 'No details',
          code: result.code || 'NO_CODE',
          fullResponse: result
        })
        
        // Handle insufficient credits error
        if (response.status === 402 || result.code === 'INSUFFICIENT_CREDITS') {
          alert(`Insufficient Credits: ${result.message || 'You do not have enough credits to scan images. Please purchase credits from the Billing section.'}`)
          // Optionally redirect to billing or show credit purchase UI
          return
        }
        
        // Handle feature access denied errors
        if (response.status === 403 || result.code === 'FEATURE_ACCESS_DENIED') {
          alert(`Access Denied: ${result.message || 'Reverse Image Search is not available in your current plan. Please upgrade to access this feature.'}`)
          return
        }
        
        // Handle rate limit errors specifically
        if (response.status === 429 || result.code === 'RATE_LIMIT_EXCEEDED') {
          const retryAfter = result.retryAfter || 5
          alert(`Rate limit reached. Please wait ${retryAfter} seconds before scanning more images.`)
          return
        }
        
        // Show user-friendly error for other errors
        if (result.message || result.error) {
          alert(`Error scanning image: ${result.message || result.error}`)
        }
        
        return
      }

      // Store scan results
      if (result.data) {
        setScanResults(prev => ({
          ...prev,
          [uniqueKey]: result.data
        }))
        // Auto-expand the row to show results
        setExpandedRows(prev => new Set(prev).add(uniqueKey))
        
        // If image has database ID, update the extra_metadata
        if (image.extra_metadata?.id) {
          image.extra_metadata.open_web_ninja_data = result.data
        }
        
        // Show credits remaining if available and refresh plan info
        if (result.creditsRemaining !== undefined) {
          console.log('✅ Credits remaining after scan:', result.creditsRemaining)
          // Refresh plan info to update credits display
          window.dispatchEvent(new Event('planUpdated'))
        }
        
        // Check if save was successful
        if (result.saveError) {
          console.error('❌ Scan completed but save to database failed:', result.saveError)
          // Show user-friendly error (you could add a toast notification here)
        } else if (result.imageId) {
          console.log('✅ Scan results saved to database for image:', result.imageId)
          
          // Refresh images from database to get updated data
          if (project?.id) {
            console.log('🔄 Refreshing images data after scan save...')
            try {
              const { data: refreshedImages, error: refreshError } = await getScrapedImages(project.id)
              if (!refreshError && refreshedImages) {
                setScrapedImagesData(refreshedImages)
                
                // Reload scan results from refreshed data into state
                const refreshedResults: Record<string, any> = {}
                refreshedImages.forEach((img: any) => {
                  if (img.open_web_ninja_data) {
                    const refreshedKey = img.id || img.original_url || ''
                    if (refreshedKey) {
                      refreshedResults[refreshedKey] = img.open_web_ninja_data
                    }
                  }
                })
                
                if (Object.keys(refreshedResults).length > 0) {
                  setScanResults(prev => ({
                    ...prev,
                    ...refreshedResults
                  }))
                  console.log('✅ Reloaded scan results from refreshed data:', Object.keys(refreshedResults).length)
                }
                
                console.log('✅ Images data refreshed, open_web_ninja_data should now be available')
              } else if (refreshError) {
                console.warn('⚠️ Could not refresh images data:', refreshError)
              }
            } catch (refreshErr) {
              console.warn('⚠️ Exception refreshing images:', refreshErr)
            }
          }
        } else {
          console.warn('⚠️ No imageId - scan results will not persist in database. Image may not be in scraped_images table yet.')
        }
      }

      console.log('✅ Image scan completed:', {
        uniqueKey,
        hasData: !!result.data,
        imageId: result.imageId,
        dataSaved: !result.saveError && !!result.imageId,
        saveError: result.saveError
      })
    } catch (error) {
      console.error('❌ Error scanning image:', error)
    } finally {
      setScanningImages(prev => {
        const next = new Set(prev)
        next.delete(uniqueKey)
        return next
      })
    }
  }

  // Toggle scan results display
  const toggleScanResults = (e: React.MouseEvent, imageKey: string) => {
    e.stopPropagation()
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(imageKey)) {
        next.delete(imageKey)
      } else {
        next.add(imageKey)
      }
      return next
    })
  }

  return (
    <div className="bg-white rounded-lg  border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Images Analysis</h3>
        <div className="text-sm text-gray-500">
          {isLoading || isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              {isLoading ? 'Loading images...' : 'Processing images...'}
            </span>
          ) : (
            <>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredImages.length)} of {filteredImages.length} images
              {filteredImages.length !== stats.total && ` (${stats.total} total)`}
              {scrapedImagesData.length > 0 && (
                <span className="ml-2 text-green-600">• From database</span>
              )}
            </>
          )}
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <div className={`rounded-lg p-4 ${(planInfo?.image_scan_credits ?? 0) < 5 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold ${(planInfo?.image_scan_credits ?? 0) < 5 ? 'text-yellow-700' : 'text-gray-900'}`}>
            {planInfo?.image_scan_credits ?? 0}
          </div>
          <div className={`text-sm ${(planInfo?.image_scan_credits ?? 0) < 5 ? 'text-yellow-600' : 'text-gray-600'}`}>
            Scan Credits
            {(planInfo?.image_scan_credits ?? 0) < 5 && (planInfo?.image_scan_credits ?? 0) > 0 && (
              <span className="block text-xs mt-1">⚠️ Low credits</span>
            )}
            {(planInfo?.image_scan_credits ?? 0) === 0 && (
              <span className="block text-xs mt-1">⚠️ No credits</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Images</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by URL, alt text, title, or page..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-[#ff4b01] text-white rounded-md hover:bg-[#e64401] transition-colors w-full sm:w-auto"
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


      {/* Images Display */}
      {filteredImages.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer tracking-wider relative group"
                    onMouseEnter={() => setShowActionsTooltip(true)}
                    onMouseLeave={() => setShowActionsTooltip(false)}
                  >
                    <div className="flex items-center gap-1.5">
                      Actions
                      <svg 
                        className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {showActionsTooltip && (
                      <div className="absolute z-50 top-full right-0 mt-1 w-64 p-3 bg-white text-black text-xs rounded-lg shadow-lg pointer-events-none">
                        
                        <p className="text-black font-medium mb-1">Search Image Usage</p>
                        <p className="text-black text-xs leading-relaxed">
                          Click the "Scan Image" button to search where this image is used across the website and analyze its usage.
                        </p>
                      </div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedImages.map((img, index) => {
                  // Create a truly unique key combining multiple identifiers
                  // Priority: database ID > URL + page_url + global index > fallback
                  const globalIndex = startIndex + index; // Use global index, not paginated index
                  
                  // Generate a stable unique key
                  let uniqueKey: string;
                  if (img.extra_metadata?.id) {
                    // Use database ID if available (most reliable)
                    uniqueKey = `img-${img.extra_metadata.id}`;
                  } else {
                    // Create a hash-like key from URL, page_url, and global index
                    const urlHash = img.url ? img.url.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '') : 'no-url';
                    const pageHash = img.page_url ? img.page_url.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '') : 'no-page';
                    uniqueKey = `img-${globalIndex}-${urlHash}-${pageHash}`;
                  }
                  
                  return (
                  <React.Fragment key={uniqueKey}>
                    <tr className="hover:bg-gray-50">
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
                          className="text-[#ff4b01] hover:text-[#e64401] text-sm"
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
                          className="text-[#ff4b01] hover:text-[#e64401] text-sm"
                        >
                          {img.page_url}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {(() => {
                          // Determine unique key for this image - must match the key used when loading from database
                          // Priority: database ID, then URL
                          const imageId = img.extra_metadata?.id || ''
                          const uniqueKey = imageId || img.url || ''
                          
                          // Check if scan data exists - check multiple possible keys
                          // 1. Check by database ID (primary key)
                          // 2. Check by full uniqueKey (ID or URL)
                          // 3. Check in metadata
                          const hasScanData = !!(
                            (imageId && scanResults[imageId]) ||
                            scanResults[uniqueKey] ||
                            img.extra_metadata?.open_web_ninja_data
                          )
                          
                          // If scan data exists, show "Show/Hide Results" button
                          if (hasScanData) {
                            // Use the database ID as the key if available, otherwise use uniqueKey
                            const displayKey = imageId || uniqueKey
                            
                            return (
                              <button
                                onClick={(e) => {
                                  // Load data from database if not already loaded in state
                                  const dataToLoad = img.extra_metadata?.open_web_ninja_data
                                  if (dataToLoad) {
                                    // Load using both possible keys to ensure it's found
                                    setScanResults(prev => {
                                      const updated = { ...prev }
                                      if (imageId) updated[imageId] = dataToLoad
                                      if (uniqueKey) updated[uniqueKey] = dataToLoad
                                      return updated
                                    })
                                  }
                                  toggleScanResults(e, displayKey)
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                              >
                                {expandedRows.has(displayKey) ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Hide Results
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Show Results
                                  </>
                                )}
                              </button>
                            )
                          }
                          
                          // If no scan data exists, show "Scan Image" button or "Upgrade Required"
                          if (hasImageScanFeature) {
                            return (
                              <button
                                onClick={(e) => handleScanImage(e, img)}
                                disabled={scanningImages.has(uniqueKey) || scanningImages.has(imageId)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#ff4b01] rounded-md hover:bg-[#e64401] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                                title={img.extra_metadata?.id ? 'Scan image from database' : 'Scan image (will be saved to database)'}
                              >
                                {(scanningImages.has(uniqueKey) || scanningImages.has(imageId)) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Scan Image
                                  </>
                                )}
                              </button>
                            )
                          }
                          
                          // Show upgrade required message
                          return (
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md flex items-center justify-center gap-1.5 cursor-not-allowed" title="Reverse Image Search is not available in your current plan">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Upgrade Required
                            </div>
                          )
                        })()}
                      </div>
                    </td>
                    </tr>
                    
                    {/* Expanded row with scan results */}
                    {expandedRows.has(img.extra_metadata?.id || img.url || '') && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-4">Reverse Image Search Results</h4>
                            {(() => {
                              const uniqueKey = img.extra_metadata?.id || img.url || ''
                              const scanData = scanResults[uniqueKey] || img.extra_metadata?.open_web_ninja_data
                              
                              if (!scanData) return <p className="text-xs text-gray-500">No results available</p>
                              
                              // Handle the new API response structure
                              const results = scanData?.data || scanData?.data?.matches || scanData?.matches || []
                              
                              if (results.length === 0) {
                                return <p className="text-xs text-gray-500">No matches found</p>
                              }
                              
                              return (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-4">
                                    Found {results.length} {results.length === 1 ? 'match' : 'matches'}
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                                    {results.map((match: any, idx: number) => (
                                      <div 
                                        key={idx} 
                                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                      >
                                        {/* Image */}
                                        {match.image && (
                                          <div className="w-full h-40 bg-gray-100 overflow-hidden">
                                            <Image
                                              src={match.image}
                                              alt={match.title || 'Match image'}
                                              width={match.image_width || 300}
                                              height={match.image_height || 200}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                const target = e.currentTarget
                                                target.style.display = 'none'
                                                const parent = target.parentElement
                                                if (parent) {
                                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Image not available</div>'
                                                }
                                              }}
                                            />
                                          </div>
                                        )}
                                        
                                        {/* Content */}
                                        <div className="p-3">
                                          {/* Domain with logo */}
                                          <div className="flex items-center gap-2 mb-2">
                                            {match.logo && (
                                              <img 
                                                src={match.logo} 
                                                alt={match.domain || 'Domain logo'}
                                                className="w-4 h-4 rounded"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none'
                                                }}
                                              />
                                            )}
                                            <span className="text-xs text-gray-500 truncate">
                                              {match.domain || 'Unknown domain'}
                                            </span>
                                            {match.date && (
                                              <span className="text-xs text-gray-400 ml-auto">
                                                {match.date}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Title */}
                                          {match.title && (
                                            <h5 className="text-xs font-medium text-gray-900 mb-2 line-clamp-2">
                                              {match.title}
                                            </h5>
                                          )}
                                          
                                          {/* Link */}
                                          {match.link && (
                                            <a
                                              href={match.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                                              title={match.link}
                                            >
                                              View Source →
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedImages.map((img, index) => {
              // Create a truly unique key combining multiple identifiers
              // Priority: database ID > URL + page_url + global index > fallback
              const globalIndex = startIndex + index; // Use global index, not paginated index
              
              // Generate a stable unique key (same logic as desktop)
              let uniqueKey: string;
              if (img.extra_metadata?.id) {
                // Use database ID if available (most reliable)
                uniqueKey = `img-${img.extra_metadata.id}`;
              } else {
                // Create a hash-like key from URL, page_url, and global index
                const urlHash = img.url ? img.url.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '') : 'no-url';
                const pageHash = img.page_url ? img.page_url.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '') : 'no-page';
                uniqueKey = `img-mobile-${globalIndex}-${urlHash}-${pageHash}`;
              }
              
              return (
              <div key={uniqueKey} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image Preview */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div 
                      className="w-24 h-24 bg-gray-100 rounded border overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleImageClick(img)}
                    >
                      <Image
                        src={img.url || img.src || ''}
                        alt={img.alt || 'No alt text'}
                        width={96}
                        height={96}
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
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* URL */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">URL</label>
                      <div className="mt-1">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm break-all"
                        >
                          {img.url}
                        </a>
                      </div>
                    </div>

                    {/* Alt Text */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Alt Text</label>
                      <div className="mt-1">
                        {img.alt && img.alt.trim() !== '' ? (
                          <span className="text-sm text-gray-900">{img.alt}</span>
                        ) : (
                          <span className="text-sm text-gray-500 italic">No alt text</span>
                        )}
                      </div>
                    </div>

                    {/* Type and Dimensions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</label>
                        <div className="mt-1">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-900 rounded-full">
                            {img.type || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</label>
                        <div className="mt-1 text-sm text-gray-500">
                          {img.width && img.height ? `${img.width}×${img.height}` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Page URL */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Page</label>
                      <div className="mt-1">
                        <a
                          href={img.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm break-all"
                        >
                          {img.page_url}
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <label 
                        className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 group"
                        onMouseEnter={() => setShowActionsTooltip(true)}
                        onMouseLeave={() => setShowActionsTooltip(false)}
                      >
                        Actions
                        <svg 
                          className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </label>
                      {showActionsTooltip && (
                        <div className="absolute z-50 top-full left-0 mt-1 w-64 p-3 bg-red-900 text-white text-xs rounded-lg shadow-lg pointer-events-none">
                          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          <p className="text-white font-medium mb-1">Search Image Usage</p>
                          <p className="text-gray-300 text-xs leading-relaxed">
                            Click the "Scan Image" button to search where this image is used across the website and analyze its usage.
                          </p>
                        </div>
                      )}
                      <div className="mt-1 space-y-2">
                        {(() => {
                          // Determine unique key for this image - must match the key used when loading from database
                          // Priority: database ID, then URL
                          const imageId = img.extra_metadata?.id || ''
                          const uniqueKey = imageId || img.url || ''
                          
                          // Check if scan data exists - check multiple possible keys
                          // 1. Check by database ID (primary key)
                          // 2. Check by full uniqueKey (ID or URL)
                          // 3. Check in metadata
                          const hasScanData = !!(
                            (imageId && scanResults[imageId]) ||
                            scanResults[uniqueKey] ||
                            img.extra_metadata?.open_web_ninja_data
                          )
                          
                          // If scan data exists, show "Show/Hide Results" button
                          if (hasScanData) {
                            // Use the database ID as the key if available, otherwise use uniqueKey
                            const displayKey = imageId || uniqueKey
                            
                            return (
                              <button
                                onClick={(e) => {
                                  // Load data from database if not already loaded in state
                                  const dataToLoad = img.extra_metadata?.open_web_ninja_data
                                  if (dataToLoad) {
                                    // Load using both possible keys to ensure it's found
                                    setScanResults(prev => {
                                      const updated = { ...prev }
                                      if (imageId) updated[imageId] = dataToLoad
                                      if (uniqueKey) updated[uniqueKey] = dataToLoad
                                      return updated
                                    })
                                  }
                                  toggleScanResults(e, displayKey)
                                }}
                                className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                              >
                                {expandedRows.has(displayKey) ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Hide Results
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Show Results
                                  </>
                                )}
                              </button>
                            )
                          }
                          
                          // If no scan data exists, show "Scan Image" button or "Upgrade Required"
                          if (hasImageScanFeature) {
                            return (
                              <button
                                onClick={(e) => handleScanImage(e, img)}
                                disabled={scanningImages.has(uniqueKey) || scanningImages.has(imageId)}
                                className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                                title={img.extra_metadata?.id ? 'Scan image from database' : 'Scan image (will be saved to database)'}
                              >
                                {(scanningImages.has(uniqueKey) || scanningImages.has(imageId)) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Scanning...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Scan Image
                                  </>
                                )}
                              </button>
                            )
                          }
                          
                          // Show upgrade required message
                          return (
                            <div className="w-full px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md flex items-center justify-center gap-1.5 cursor-not-allowed" title="Reverse Image Search is not available in your current plan">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Upgrade Required
                            </div>
                          )
                        })()}
                      </div>
                      
                      {/* Expanded scan results */}
                      {expandedRows.has(img.extra_metadata?.id || img.url || '') && (
                        <div className="mt-3 bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-4">Reverse Image Search Results</h4>
                          {(() => {
                            const uniqueKey = img.extra_metadata?.id || img.url || ''
                            const scanData = scanResults[uniqueKey] || img.extra_metadata?.open_web_ninja_data
                            
                            if (!scanData) return <p className="text-xs text-gray-500">No results available</p>
                            
                            // Handle the new API response structure
                            const results = scanData?.data || scanData?.data?.matches || scanData?.matches || []
                            
                            if (results.length === 0) {
                              return <p className="text-xs text-gray-500">No matches found</p>
                            }
                            
                            return (
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-4">
                                  Found {results.length} {results.length === 1 ? 'match' : 'matches'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                  {results.map((match: any, idx: number) => (
                                    <div 
                                      key={idx} 
                                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                      {/* Image */}
                                      {match.image && (
                                        <div className="w-full h-40 bg-gray-100 overflow-hidden">
                                          <Image
                                            src={match.image}
                                            alt={match.title || 'Match image'}
                                            width={match.image_width || 300}
                                            height={match.image_height || 200}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const target = e.currentTarget
                                              target.style.display = 'none'
                                              const parent = target.parentElement
                                              if (parent) {
                                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Image not available</div>'
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                      
                                      {/* Content */}
                                      <div className="p-3">
                                        {/* Domain with logo */}
                                        <div className="flex items-center gap-2 mb-2">
                                          {match.logo && (
                                            <img 
                                              src={match.logo} 
                                              alt={match.domain || 'Domain logo'}
                                              className="w-4 h-4 rounded"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                              }}
                                            />
                                          )}
                                          <span className="text-xs text-gray-500 truncate">
                                            {match.domain || 'Unknown domain'}
                                          </span>
                                          {match.date && (
                                            <span className="text-xs text-gray-400 ml-auto">
                                              {match.date}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {/* Title */}
                                        {match.title && (
                                          <h5 className="text-xs font-medium text-gray-900 mb-2 line-clamp-2">
                                            {match.title}
                                          </h5>
                                        )}
                                        
                                        {/* Link */}
                                        {match.link && (
                                          <a
                                            href={match.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                                            title={match.link}
                                          >
                                            View Source →
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center sm:justify-start text-sm text-gray-700">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">‹</span>
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
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">›</span>
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
                      className="flex-1 bg-[#ff4b01] text-white px-4 py-2 rounded-md hover:bg-[#e64401] transition-colors text-center"
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
