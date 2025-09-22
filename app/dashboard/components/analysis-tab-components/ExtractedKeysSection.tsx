'use client'

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ExtractedKeysSectionProps {
  extractedKeys: Record<string, unknown>
}

interface KeyItemProps {
  keyPath: string
  keyData: Record<string, unknown> | { type: string; value: unknown; isArray?: boolean; isNull?: boolean; isUndefined?: boolean; length?: number }
  level: number
  searchTerm: string
}

const KeyItem: React.FC<KeyItemProps> = ({ keyPath, keyData, level, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = keyData && typeof keyData === 'object' && !keyData.type && !keyData.value
  
  const isVisible = !searchTerm || 
    keyPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (keyData && typeof keyData === 'object' && 'value' in keyData && String(keyData.value).toLowerCase().includes(searchTerm.toLowerCase()))

  if (!isVisible) return null

  return (
    <div className="ml-4">
      <div 
        className={`flex items-center py-1 px-2 rounded hover:bg-slate-50 cursor-pointer ${
          hasChildren ? 'font-medium' : 'font-normal'
        }`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ marginLeft: `${level * 16}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 mr-2 text-slate-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 mr-2 text-slate-500" />
          )
        ) : (
          <div className="w-4 h-4 mr-2" />
        )}
        
        <span className="text-slate-700 font-mono text-sm">
          {keyPath.split('.').pop()}
        </span>
        
        {keyData && typeof keyData === 'object' && 'type' in keyData && (
          <span className="ml-2 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
            {String(keyData.type)}
          </span>
        )}
        
        {keyData && typeof keyData === 'object' && 'value' in keyData && keyData.value !== undefined && keyData.value !== null && (
          <span className="ml-2 text-slate-500 text-sm truncate max-w-xs">
            {typeof keyData.value === 'string' && keyData.value.length > 50 
              ? `"${keyData.value.substring(0, 50)}..."` 
              : JSON.stringify(keyData.value)
            }
          </span>
        )}
        
        {keyData && typeof keyData === 'object' && 'length' in keyData && (
          <span className="ml-2 text-slate-400 text-xs">
            ({String(keyData.length)} items)
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {Object.entries(keyData).map(([subKey, subValue]) => (
            <KeyItem
              key={`${keyPath}.${subKey}`}
              keyPath={`${keyPath}.${subKey}`}
              keyData={subValue as Record<string, unknown> | { type: string; value: unknown; isArray?: boolean; isNull?: boolean; isUndefined?: boolean; length?: number }}
              level={level + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const ExtractedKeysSection: React.FC<ExtractedKeysSectionProps> = ({ extractedKeys }) => {
  const [searchTerm, setSearchTerm] = useState('')

  if (!extractedKeys) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <MagnifyingGlassIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Data Keys Found</h3>
          <p className="text-slate-500">
            Run a scraping analysis to extract and organize all data keys from the website.
          </p>
        </div>
      </div>
    )
  }

  const keyCount = Object.keys(extractedKeys).length
  const filteredKeys = Object.entries(extractedKeys).filter(([keyPath, keyData]) => {
    if (!searchTerm) return true
    return keyPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (keyData && typeof keyData === 'object' && 'value' in keyData && String(keyData.value).toLowerCase().includes(searchTerm.toLowerCase()))
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Data Keys Explorer</h2>
            <p className="text-sm text-slate-500 mt-1">
              {keyCount} keys extracted from scraping data
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="p-6">
        {filteredKeys.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No keys match your search.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredKeys.map(([keyPath, keyData]) => (
              <KeyItem
                key={keyPath}
                keyPath={keyPath}
                keyData={keyData as Record<string, unknown> | { type: string; value: unknown; isArray?: boolean; isNull?: boolean; isUndefined?: boolean; length?: number }}
                level={0}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing {filteredKeys.length} of {keyCount} keys
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExtractedKeysSection


