'use client'

import { useState } from 'react'

interface FilterPanelProps {
  onFiltersChange: (filters: {
    startDate: string
    endDate: string
    planId: string
    chartType: string
  }) => void
  plans: Array<{ id: string; name: string }>
}

export default function FilterPanel({ onFiltersChange, plans }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    planId: '',
    chartType: 'revenue'
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const resetFilters = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      planId: '',
      chartType: 'revenue'
    }
    setFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          />
        </div>
        
        {/* Plan Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
          <select
            value={filters.planId}
            onChange={(e) => handleFilterChange('planId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          >
            <option value="">All Plans</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Chart Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
          <select
            value={filters.chartType}
            onChange={(e) => handleFilterChange('chartType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
          >
            <option value="revenue">Revenue Growth</option>
            <option value="users">User Growth</option>
            <option value="plans">Plan Distribution</option>
          </select>
        </div>
      </div>
    </div>
  )
}
