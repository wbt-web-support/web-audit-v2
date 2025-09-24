'use client'

import { useEffect, use } from 'react'

interface PageAnalysisPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PageAnalysisPage({ params }: PageAnalysisPageProps) {
  // Unwrap the params Promise
  const resolvedParams = use(params)

  useEffect(() => {
    // Redirect to dashboard with page-analysis tab
    window.location.href = `/dashboard?tab=page-analysis&pageId=${resolvedParams.id}`
  }, [resolvedParams.id])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to page analysis...</p>
      </div>
    </div>
  )
}
