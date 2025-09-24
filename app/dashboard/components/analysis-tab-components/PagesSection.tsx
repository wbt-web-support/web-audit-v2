'use client'

interface PagesSectionProps {
  scrapedPages: any[]
  projectId?: string
  onPageSelect?: (pageId: string) => void
}

export default function PagesSection({ scrapedPages, projectId, onPageSelect }: PagesSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scraped Pages</h3>
      {scrapedPages.length > 0 ? (
        <div className="space-y-4">
          {scrapedPages.map((page, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{page.title || 'Untitled'}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  page.status_code >= 200 && page.status_code < 300 ? 'bg-green-100 text-green-800' :
                  page.status_code >= 300 && page.status_code < 400 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {page.status_code}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{page.url}</p>
              {page.description && (
                <p className="text-sm text-gray-700 mb-3">{page.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{page.links_count} links</span>
                  <span>{page.images_count} images</span>
                  <span>{page.meta_tags_count} meta tags</span>
                  <span>{page.technologies_count} technologies</span>
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
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Analyze
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No scraped pages data available</p>
        </div>
      )}
    </div>
  )
}
