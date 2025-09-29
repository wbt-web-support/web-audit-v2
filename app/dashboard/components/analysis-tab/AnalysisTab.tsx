'use client'

import { AnalysisTabProps } from './types'
import AnalysisTabContent from './AnalysisTabContent'

export default function AnalysisTab({ 
  projectId, 
  cachedData, 
  onDataUpdate, 
  onPageSelect 
}: AnalysisTabProps) {
  return (
    <AnalysisTabContent 
      projectId={projectId} 
      cachedData={cachedData} 
      onDataUpdate={onDataUpdate} 
      onPageSelect={onPageSelect} 
    />
  )
}
