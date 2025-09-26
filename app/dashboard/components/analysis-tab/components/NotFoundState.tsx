import React from 'react'

interface NotFoundStateProps {
  onViewProjects?: () => void
  onGoToDashboard?: () => void
}

export default function NotFoundState({ onViewProjects, onGoToDashboard }: NotFoundStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
      <p className="text-gray-600 mb-4">The requested project could not be found or you may not have access to it.</p>
      <div className="flex gap-3 justify-center">
        {onViewProjects && (
          <button 
            onClick={onViewProjects}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
