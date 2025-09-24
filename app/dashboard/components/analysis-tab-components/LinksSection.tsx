'use client'

import { useState, useMemo } from 'react'
import { AuditProject } from '@/types/audit'

interface LinksSectionProps {
  project: AuditProject
  scrapedPages: any[]
  originalScrapingData?: any
}

interface LinkData {
  url: string
  text: string | null
  title: string | null
  type: 'internal' | 'external'
  page_url?: string
  target?: string
  rel?: string
}

export default function LinksSection({ project, scrapedPages, originalScrapingData }: LinksSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'external'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(40)

  // Extract links from original scraping data or HTML content
  const links = useMemo(() => {
    const allLinks: LinkData[] = []
    const baseDomain = project.site_url ? new URL(project.site_url).hostname : ''
    
    // First, try to extract from original scraping data
    if (originalScrapingData?.pages && Array.isArray(originalScrapingData.pages)) {
      
      
      originalScrapingData.pages.forEach((page: any) => {
        if (page.links && Array.isArray(page.links)) {
          page.links.forEach((link: any) => {
            const href = link.href || link.url || ''
            if (href && href !== '#') {
              // Convert relative URLs to absolute
              const absoluteUrl = href.startsWith('http') ? href : 
                href.startsWith('/') ? `${project.site_url}${href}` : 
                `${project.site_url}/${href}`
              
              const isInternal = href.startsWith('/') || 
                (href.startsWith('http') && href.includes(baseDomain))
              
              allLinks.push({
                url: absoluteUrl,
                text: link.text || link.innerText || null,
                title: link.title || null,
                type: isInternal ? 'internal' : 'external',
                page_url: page.url,
                target: link.target || '_self',
                rel: link.rel || undefined
              })
            }
          })
        }
      })
    }
    
    // If no links found in scraping data, fall back to HTML parsing
    if (allLinks.length === 0 && scrapedPages && scrapedPages.length > 0) {
      
      
      scrapedPages.forEach((page: any) => {
        if (page.html_content) {
          try {
            // Create a temporary DOM parser to extract links
            if (typeof DOMParser === 'undefined') {
              console.warn('DOMParser not available in this environment')
              return
            }
            const parser = new DOMParser()
            const doc = parser.parseFromString(page.html_content, 'text/html')
            const linkElements = doc.querySelectorAll('a[href]')
            
            linkElements.forEach((link) => {
              const anchorElement = link as HTMLAnchorElement
              const href = anchorElement.href || anchorElement.getAttribute('href') || ''
              if (href && href !== '#') {
                // Convert relative URLs to absolute
                const absoluteUrl = href.startsWith('http') ? href : 
                  href.startsWith('/') ? `${project.site_url}${href}` : 
                  `${project.site_url}/${href}`
                
                const isInternal = href.startsWith('/') || 
                  (href.startsWith('http') && href.includes(baseDomain))
                
                allLinks.push({
                  url: absoluteUrl,
                  text: anchorElement.textContent?.trim() || null,
                  title: anchorElement.title || null,
                  type: isInternal ? 'internal' : 'external',
                  page_url: page.url,
                  target: anchorElement.target || '_self',
                  rel: anchorElement.rel || undefined
                })
              }
            })
          } catch (error) {
            console.warn('Error parsing HTML for links:', error)
          }
        }
      })
    }
    
    return allLinks
  }, [scrapedPages, project.site_url, originalScrapingData])

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.text && link.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.title && link.title.toLowerCase().includes(searchTerm.toLowerCase()))

      // Type filter
      const matchesType = typeFilter === 'all' || link.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [links, searchTerm, typeFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLinks = filteredLinks.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleFilterChange = (newSearchTerm: string, newTypeFilter: 'all' | 'internal' | 'external') => {
    setSearchTerm(newSearchTerm)
    setTypeFilter(newTypeFilter)
    setCurrentPage(1)
  }

  const stats = useMemo(() => {
    const total = links.length
    const internal = links.filter(link => link.type === 'internal').length
    const external = links.filter(link => link.type === 'external').length
    
    return { total, internal, external }
  }, [links])


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Links Analysis</h3>
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredLinks.length)} of {filteredLinks.length} links
          {filteredLinks.length !== stats.total && ` (${stats.total} total)`}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Links</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.internal}</div>
          <div className="text-sm text-gray-600">Internal</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.external}</div>
          <div className="text-sm text-gray-600">External</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end gap-3 mb-6">
        {/* Search */}
        <div className="w-48">
          <input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => handleFilterChange(e.target.value, typeFilter)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Type Filter */}
        <div className="w-40">
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(searchTerm, e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="all">All Links</option>
            <option value="internal">Internal Links</option>
            <option value="external">External Links</option>
          </select>
        </div>
      </div>

      {/* Links Table */}
      {filteredLinks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link Text
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLinks.map((link, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {link.text || 'No text'}
                      </div>
                      {link.title && (
                        <div className="text-sm text-gray-500 truncate" title={link.title}>
                          {link.title}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                      >
                        {link.url}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      link.type === 'internal' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      {link.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.target || '_self'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate">
                      <a
                        href={link.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {link.page_url}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-gray-600">No links found matching your filters</p>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredLinks.length > itemsPerPage && (
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
