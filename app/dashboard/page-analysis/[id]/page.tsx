'use client'

import { use } from 'react'
import PageAnalysisTab from '../../components/tabs/PageAnalysisTab'

interface PageAnalysisPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PageAnalysisPage({ params }: PageAnalysisPageProps) {
  // Unwrap the params Promise
  const resolvedParams = use(params)

  return <PageAnalysisTab pageId={resolvedParams.id} />
}
