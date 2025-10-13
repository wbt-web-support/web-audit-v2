'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { AuditProject } from '@/types/audit'
import { ScrapedPage } from '../analysis-tab/types'

// Override the ScrapedPage type to accept any performance_analysis type
interface ScrapedPageOverride extends Omit<ScrapedPage, 'performance_analysis'> {
  performance_analysis?: Record<string, unknown>
}

interface OriginalScrapingData {
  pages?: ScrapedPageOverride[]
}

interface LinksSectionProps {
  project: AuditProject
  scrapedPages: ScrapedPageOverride[]
  originalScrapingData?: OriginalScrapingData
}

interface LinkData {
  url: string
  text: string | null
  title: string | null
  type: 'internal' | 'external'
  page_url?: string
  target?: string
  rel?: string
  isBroken?: boolean
  status?: 'working' | 'broken' | 'unknown'
}


export default function LinksSection({ project, scrapedPages, originalScrapingData }: LinksSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Reduced from 40 to 20 for better performance
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Filter states
  const [selectedLinkType, setSelectedLinkType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBrokenOnly, setShowBrokenOnly] = useState(false)
  const [showWorkingOnly, setShowWorkingOnly] = useState(false)
  const [isCheckingBrokenLinks, setIsCheckingBrokenLinks] = useState(false)

  // Function to check if a link is broken
  const checkLinkBroken = useCallback(async (linkUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(linkUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // This allows checking cross-origin links
      })
      return false // If we get here, the link is working
    } catch (error) {
      return true // Link is broken
    }
  }, [])

  // Function to check all links for broken status
  const checkAllLinksBroken = useCallback(async (links: LinkData[]) => {
    setIsCheckingBrokenLinks(true)
    const updatedLinks = await Promise.all(
      links.map(async (link) => {
        if (link.url) {
          const isBroken = await checkLinkBroken(link.url)
          return { 
            ...link, 
            isBroken,
            status: isBroken ? 'broken' : 'working'
          }
        }
        return { ...link, status: 'unknown' }
      })
    )
    setIsCheckingBrokenLinks(false)
    return updatedLinks
  }, [checkLinkBroken])

  // Extract links from original scraping data or HTML content
  const links = useMemo(() => {
    setIsProcessing(true)
    const allLinks: LinkData[] = []
    const baseDomain = project.site_url ? new URL(project.site_url).hostname : ''
    
    // First, try to extract from original scraping data
    if (originalScrapingData?.pages && Array.isArray(originalScrapingData.pages)) {
      
      
      originalScrapingData.pages.forEach((page: ScrapedPageOverride) => {
        if (page.links && Array.isArray(page.links)) {
          page.links.forEach((link) => {
            const href = link.url || ''
            if (href && href !== '#') {
              // Filter out localhost URLs
              if (href.includes('localhost') || href.includes('127.0.0.1')) {
                return
              }
              
              // Convert relative URLs to absolute
              let absoluteUrl = href.startsWith('http') ? href : 
                href.startsWith('/') ? `${project.site_url}${href}` : 
                `${project.site_url}/${href}`
              
              // Convert HTTP to HTTPS
              if (absoluteUrl.startsWith('http://')) {
                absoluteUrl = absoluteUrl.replace('http://', 'https://')
              }
              
              const isInternal = href.startsWith('/') || 
                (href.startsWith('http') && href.includes(baseDomain))
              
              allLinks.push({
                url: absoluteUrl,
                text: link.text || null,
                title: link.title || null,
                type: isInternal ? 'internal' : 'external',
                page_url: page.url,
                target: '_self',
                rel: undefined
              })
            }
          })
        }
      })
    }
    
    // If no links found in scraping data, fall back to HTML parsing
    if (allLinks.length === 0 && scrapedPages && scrapedPages.length > 0) {
      
      
      scrapedPages.forEach((page: ScrapedPageOverride) => {
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
                // Filter out localhost URLs
                if (href.includes('localhost') || href.includes('127.0.0.1')) {
                  return
                }
                
                // Convert relative URLs to absolute
                let absoluteUrl = href.startsWith('http') ? href : 
                  href.startsWith('/') ? `${project.site_url}${href}` : 
                  `${project.site_url}/${href}`
                
                // Convert HTTP to HTTPS
                if (absoluteUrl.startsWith('http://')) {
                  absoluteUrl = absoluteUrl.replace('http://', 'https://')
                }
                
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
    
    setIsProcessing(false)
    return allLinks
  }, [scrapedPages, project.site_url, originalScrapingData])

  // Filter links based on selected criteria
  const filteredLinks = useMemo(() => {
    let filtered = [...links]

    // Filter by link type
    if (selectedLinkType !== 'all') {
      filtered = filtered.filter(link => link.type === selectedLinkType)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(link => 
        link.url?.toLowerCase().includes(query) ||
        link.text?.toLowerCase().includes(query) ||
        link.title?.toLowerCase().includes(query) ||
        link.page_url?.toLowerCase().includes(query)
      )
    }


    return filtered
  }, [links, selectedLinkType, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLinks = filteredLinks.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedLinkType, searchQuery])

  const stats = useMemo(() => {
    const total = links.length
    const internal = links.filter(link => link.type === 'internal').length
    const external = links.filter(link => link.type === 'external').length
    const broken = links.filter(link => link.isBroken === true).length
    const working = links.filter(link => link.isBroken === false).length
    
    return { total, internal, external, broken, working }
  }, [links])

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
  }

  // Handle check broken links
  const handleCheckBrokenLinks = async () => {
    const updatedLinks = await checkAllLinksBroken(links)
    // Note: This would need to be handled by parent component or state management
    // For now, we'll just show the loading state
  }


  // Export functions
  const exportToCSV = () => {
    setIsExporting(true)
    try {
      const csvContent = [
        ['URL', 'Text', 'Title', 'Type', 'Target', 'Page URL'],
        ...filteredLinks.map(link => [
          link.url,
          link.text || '',
          link.title || '',
          link.type,
          link.target || '_self',
          link.page_url || ''
        ])
      ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `links-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = () => {
    setIsExporting(true)
    try {
      const jsonContent = {
        exportDate: new Date().toISOString(),
        project: project.site_url,
        totalLinks: filteredLinks.length,
        links: filteredLinks.map(link => ({
          url: link.url,
          text: link.text,
          title: link.title,
          type: link.type,
          target: link.target,
          page_url: link.page_url,
          rel: link.rel
        }))
      }

      const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `links-export-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting JSON:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToTXT = () => {
    setIsExporting(true)
    try {
      const txtContent = [
        `Links Export - ${project.site_url}`,
        `Export Date: ${new Date().toLocaleString()}`,
        `Total Links: ${filteredLinks.length}`,
        '',
        '='.repeat(80),
        '',
        ...filteredLinks.map((link, index) => [
          `${index + 1}. ${link.url}`,
          `   Text: ${link.text || 'No text'}`,
          `   Title: ${link.title || 'No title'}`,
          `   Type: ${link.type}`,
          `   Target: ${link.target || '_self'}`,
          `   Page: ${link.page_url || 'Unknown'}`,
          ''
        ].join('\n'))
      ].join('\n')

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `links-export-${new Date().toISOString().split('T')[0]}.txt`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting TXT:', error)
    } finally {
      setIsExporting(false)
    }
  }


  return (
    <div className="bg-white rounded-lg  border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Links Analysis</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                Processing links...
              </span>
            ) : (
              <>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLinks.length)} of {filteredLinks.length} links
                {filteredLinks.length !== stats.total && ` (${stats.total} total)`}
              </>
            )}
          </div>
          
          {/* Export Button */}
          {filteredLinks.length > 0 && (
            <div className="relative group">
              <button
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </>
                )}
              </button>
              
              {/* Export Options Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    disabled={isExporting}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Export as JSON
                  </button>
                  <button
                    onClick={exportToTXT}
                    disabled={isExporting}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as TXT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.broken}</div>
          <div className="text-sm text-gray-600">Broken Links</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.working}</div>
          <div className="text-sm text-gray-600">Working Links</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Links</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by URL, text, title, or page..."
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

          {/* Link Type Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
            <select
              value={selectedLinkType}
              onChange={(e) => setSelectedLinkType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>

        </div>

        {/* Clear Filters */}
        {(selectedLinkType !== 'all' || searchQuery) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setSelectedLinkType('all')
                setSearchQuery('')
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
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