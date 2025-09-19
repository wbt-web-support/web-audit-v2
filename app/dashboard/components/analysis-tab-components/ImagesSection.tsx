'use client'

import { useState, useMemo } from 'react'
import { AuditProject } from '@/types/audit'

interface ImagesSectionProps {
  project: AuditProject
  scrapedPages: any[]
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

export default function ImagesSection({ project, scrapedPages }: ImagesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [altFilter, setAltFilter] = useState<'all' | 'with-alt' | 'without-alt'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Extract images from scraped pages data
  const images = useMemo(() => {
    if (!scrapedPages) return []
    
    const allImages: ImageData[] = []
    
    scrapedPages.forEach((page: any) => {
      if (page.images && Array.isArray(page.images)) {
        page.images.forEach((img: any) => {
          allImages.push({
            url: img.src || img.url || '',
            alt: img.alt || null,
            title: img.title || null,
            width: img.width,
            height: img.height,
            type: img.type || getImageType(img.src || img.url || ''),
            size: img.size,
            page_url: page.url
          })
        })
      }
    })
    
    return allImages
  }, [scrapedPages])

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
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-600">Total Images</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.withAlt}</div>
          <div className="text-sm text-green-600">With Alt Text</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.withoutAlt}</div>
          <div className="text-sm text-red-600">Without Alt Text</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Alt Text Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
          <select
            value={altFilter}
            onChange={(e) => setAltFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Images</option>
            <option value="with-alt">With Alt Text</option>
            <option value="without-alt">Without Alt Text</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.alt || 'No alt text'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
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
                        <span className="text-sm text-red-500 italic">No alt text</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
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
