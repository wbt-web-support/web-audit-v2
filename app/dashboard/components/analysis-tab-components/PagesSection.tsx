'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'

import { ScrapedPage } from '../analysis-tab/types'

interface PagesSectionProps {
  scrapedPages: ScrapedPage[]
  projectId?: string
  onPageSelect?: (pageId: string) => void
  onPagesUpdate?: (pages: ScrapedPage[]) => void
}

export default function PagesSection({ 
  scrapedPages, 
  projectId, 
  onPageSelect, 
  onPagesUpdate 
}: PagesSectionProps) {
  const { getScrapedPages } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState(scrapedPages || [])
  const [hasLoadedPages, setHasLoadedPages] = useState(scrapedPages && scrapedPages.length > 0)
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'status_code'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'redirect'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRequestInProgress, setIsRequestInProgress] = useState(false)

  // Update pages when scrapedPages prop changes and handle persistence
  useEffect(() => {
    if (scrapedPages && scrapedPages.length > 0) {
      setPages(scrapedPages)
      setHasLoadedPages(true)
    }
  }, [scrapedPages])

  // Fetch pages function
  const fetchPages = useCallback(async () => {
    if (!projectId || isRequestInProgress) return
    
    setIsRequestInProgress(true)
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await getScrapedPages(projectId)
      if (fetchError) {
        console.error('Error fetching pages:', fetchError)
        console.error('Error details:', JSON.stringify(fetchError, null, 2))
        
        // Handle database timeout errors gracefully
        if (fetchError.code === '57014') {
          setError('Database timeout - please try again later')
        } else {
          throw new Error(fetchError.message || 'Failed to fetch pages')
        }
        return
      }
      
      if (data) {
        setPages(data)
        setHasLoadedPages(true)
        if (onPagesUpdate) {
          onPagesUpdate(data)
        }
      }
    } catch (err) {
      console.error('Error fetching pages:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : 'Failed to fetch pages')
    } finally {
      setIsLoading(false)
      setIsRequestInProgress(false)
    }
  }, [projectId, isRequestInProgress, getScrapedPages, onPagesUpdate])

  // Auto-load pages when component mounts if no data is available - single consolidated effect
  useEffect(() => {
    if (projectId && !hasLoadedPages && pages.length === 0 && !isLoading && !isRequestInProgress) {
      fetchPages()
    }
  }, [projectId, hasLoadedPages, pages.length, isLoading, isRequestInProgress, fetchPages])

  // Filter and sort pages
  const filteredAndSortedPages = pages
    .filter(page => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'success') return page.status_code && page.status_code >= 200 && page.status_code < 300
      if (filterStatus === 'error') return !page.status_code || page.status_code >= 400
      if (filterStatus === 'redirect') return page.status_code && page.status_code >= 300 && page.status_code < 400
      return true
    })
    .sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortBy) {
        case 'title':
          aValue = a.title || ''
          bValue = b.title || ''
          break
        case 'status_code':
          aValue = a.status_code || 0
          bValue = b.status_code || 0
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedPages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPages = filteredAndSortedPages.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, sortBy, sortOrder, itemsPerPage])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Scraped Pages</h3>
          {hasLoadedPages && pages.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Data Loaded
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPages}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'error' | 'redirect')}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Pages</option>
            <option value="success">Success (200-299)</option>
            <option value="redirect">Redirect (300-399)</option>
            <option value="error">Error (400+)</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'title' | 'status_code')}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Date</option>
            <option value="title">Title</option>
            <option value="status_code">Status Code</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Order:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Loading pages...</span>
          </div>
        </div>
      )}

      {/* Pages List */}
      {!isLoading && filteredAndSortedPages.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-2">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPages.length)} of {filteredAndSortedPages.length} pages
            {filteredAndSortedPages.length !== pages.length && ` (${pages.length} total)`}
          </div>
          {paginatedPages.map((page, index) => (
            <div key={page.id || index} className="border border-gray-200 rounded-lg p-4 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h4 className="font-medium text-gray-900 truncate min-w-0 flex-1">{page.title || 'Untitled'}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                  page.status_code && page.status_code >= 200 && page.status_code < 300 ? 'bg-green-100 text-green-800' :
                  page.status_code && page.status_code >= 300 && page.status_code < 400 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {page.status_code || 'N/A'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 break-all">{page.url}</p>
              {page.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{page.description}</p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
                  <span className="hidden sm:inline">{page.links_count} links</span>
                  <span className="hidden sm:inline">{page.images_count} images</span>
                  <span className="hidden md:inline">{page.meta_tags_count} meta tags</span>
                  <span className="hidden md:inline">{page.technologies_count} technologies</span>
                  {/* Show only essential info on mobile */}
                  <span className="sm:hidden">{page.links_count} links, {page.images_count} images</span>
                </div>
                <button
                  onClick={() => {
                    if (page.id && onPageSelect) {
                      onPageSelect(page.id)
                    } else if (page.id) {
                      // Fallback to URL navigation if no callback provided
                      window.location.href = `/dashboard/page-analysis/${page.id}`
                    } else {
                      console.warn('No page ID available for analysis')
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto flex-shrink-0"
                >
                  Analyze
                </button>
              </div>
            </div>
          ))}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">First</span>
                  <span className="sm:hidden">«</span>
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">‹</span>
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Last</span>
                  <span className="sm:hidden">»</span>
                </button>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end space-x-2">
                <span className="text-sm text-gray-700">Go to page:</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <option key={pageNum} value={pageNum}>
                      {pageNum}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No scraped pages data available</p>
          {hasLoadedPages && (
            <p className="text-sm text-gray-500 mt-1">Data will persist when switching tabs</p>
          )}
          {projectId && (
            <button
              onClick={fetchPages}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Try fetching pages
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
