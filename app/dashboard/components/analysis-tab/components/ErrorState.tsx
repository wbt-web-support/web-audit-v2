import React from 'react'

interface ErrorStateProps {
  error: string | null
  scrapingError: string | null
  onRetryScraping?: () => void
  onRetryLoading?: () => void
  onViewProjects?: () => void
  onGoToDashboard?: () => void
}

export default function ErrorState({ 
  error, 
  scrapingError, 
  onRetryScraping, 
  onRetryLoading, 
  onViewProjects, 
  onGoToDashboard 
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {scrapingError ? 'Scraping Error' : 'Error Loading Analysis'}
      </h3>
      <p className="text-gray-600 mb-4">{scrapingError || error}</p>
      <div className="flex gap-3 justify-center">
        {scrapingError && onRetryScraping && (
          <button 
            onClick={onRetryScraping}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Scraping
          </button>
        )}
        {!scrapingError && onRetryLoading && (
          <button 
            onClick={onRetryLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        )}
        {onViewProjects && (
          <button 
            onClick={onViewProjects}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            View All Projects
          </button>
        )}
        {onGoToDashboard && (
          <button 
            onClick={onGoToDashboard}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  )
}
