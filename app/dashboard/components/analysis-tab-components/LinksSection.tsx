'use client'

import { useState, useMemo } from 'react'
import { AuditProject } from '@/types/audit'

interface LinksSectionProps {
  project: AuditProject
  scrapedPages: any[]
}

interface LinkData {
  url: string
  text: string | null
  title: string | null
  type: 'internal' | 'external'
  status_code?: number
  page_url?: string
  target?: string
  rel?: string
}

export default function LinksSection({ project, scrapedPages }: LinksSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'external'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Extract links from scraped pages data
  const links = useMemo(() => {
    if (!scrapedPages) return []
    
    const allLinks: LinkData[] = []
    const baseDomain = project.site_url ? new URL(project.site_url).hostname : ''
    
    scrapedPages.forEach((page: any) => {
      if (page.links && Array.isArray(page.links)) {
        page.links.forEach((link: any) => {
          const linkUrl = link.href || link.url || ''
          const isInternal = linkUrl.startsWith('/') || 
            (linkUrl.startsWith('http') && linkUrl.includes(baseDomain))
          
          allLinks.push({
            url: linkUrl,
            text: link.text || link.innerText || null,
            title: link.title || null,
            type: isInternal ? 'internal' : 'external',
            status_code: link.status_code,
            page_url: page.url,
            target: link.target,
            rel: link.rel
          })
        })
      }
    })
    
    return allLinks
  }, [scrapedPages, project.site_url])

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.text && link.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.title && link.title.toLowerCase().includes(searchTerm.toLowerCase()))

      // Type filter
      const matchesType = typeFilter === 'all' || link.type === typeFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'working' && link.status_code && link.status_code >= 200 && link.status_code < 400) ||
        (statusFilter === 'broken' && link.status_code && (link.status_code >= 400 || link.status_code < 200)) ||
        (statusFilter === 'unknown' && !link.status_code)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [links, searchTerm, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const total = links.length
    const internal = links.filter(link => link.type === 'internal').length
    const external = links.filter(link => link.type === 'external').length
    const working = links.filter(link => link.status_code && link.status_code >= 200 && link.status_code < 400).length
    const broken = links.filter(link => link.status_code && (link.status_code >= 400 || link.status_code < 200)).length
    
    return { total, internal, external, working, broken }
  }, [links])

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'bg-gray-100 text-gray-800'
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800'
    if (statusCode >= 300 && statusCode < 400) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getStatusText = (statusCode?: number) => {
    if (!statusCode) return 'Unknown'
    if (statusCode >= 200 && statusCode < 300) return 'Working'
    if (statusCode >= 300 && statusCode < 400) return 'Redirect'
    return 'Broken'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Links Analysis</h3>
        <div className="text-sm text-gray-500">
          {filteredLinks.length} of {stats.total} links
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-600">Total Links</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.internal}</div>
          <div className="text-sm text-green-600">Internal</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.external}</div>
          <div className="text-sm text-purple-600">External</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.working}</div>
          <div className="text-sm text-emerald-600">Working</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.broken}</div>
          <div className="text-sm text-red-600">Broken</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Links</option>
            <option value="internal">Internal Links</option>
            <option value="external">External Links</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="working">Working</option>
            <option value="broken">Broken</option>
            <option value="unknown">Unknown</option>
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
                  Status
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
              {filteredLinks.map((link, index) => (
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
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {link.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(link.status_code)}`}>
                        {link.status_code || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getStatusText(link.status_code)}
                      </span>
                    </div>
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
    </div>
  )
}
