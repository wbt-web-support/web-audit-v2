'use client'

import { AuditProject } from '@/types/audit'

interface PerformanceSectionProps {
  project: AuditProject
}

export default function PerformanceSection({ project }: PerformanceSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{project.total_pages || 0}</div>
          <div className="text-sm text-gray-600">Total Pages</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(project.total_html_content / 1000) || 0}K</div>
          <div className="text-sm text-gray-600">Total HTML Content</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{Math.round(project.average_html_per_page / 1000) || 0}K</div>
          <div className="text-sm text-gray-600">Avg HTML per Page</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{(project as any).pages_per_second || 0}</div>
          <div className="text-sm text-gray-600">Pages per Second</div>
        </div>
      </div>
    </div>
  )
}
