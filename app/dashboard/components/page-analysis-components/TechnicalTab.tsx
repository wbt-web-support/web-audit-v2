'use client'

import { useState } from 'react'
import KeysTab from '../analysis-tab-components/subtabs/KeysTab'
import TechnologiesTab from '../analysis-tab-components/subtabs/TechnologiesTab'

interface TechnicalTabProps {
  page: any
}

export default function TechnicalTab({ page }: TechnicalTabProps) {
  const [activeTab, setActiveTab] = useState('structure')
  const content = page.html_content || ''
  
  // Convert string array to technology objects if needed
  const rawTechnologies = page.technologies || []
  const technologies = Array.isArray(rawTechnologies) 
    ? rawTechnologies.map((tech: any) => {
        if (typeof tech === 'string') {
          return {
            name: tech,
            version: null,
            category: 'detected',
            confidence: 0.9,
            detection_method: 'page_analysis',
            description: null,
            website: null,
            icon: null
          }
        }
        return tech
      })
    : []
  
  // Technical Analysis
  const hasDoctype = content.includes('<!DOCTYPE')
  const hasHtmlTag = content.includes('<html')
  const hasHeadTag = content.includes('<head')
  const hasBodyTag = content.includes('<body')
  const hasTitleTag = content.includes('<title')
  const hasMetaCharset = content.includes('charset=') || content.includes('charset =')
  const hasMetaViewport = content.includes('viewport')
  // const hasMetaDescription = content.includes('description')
  // const hasMetaKeywords = content.includes('keywords')
  // const hasCanonical = content.includes('canonical')
  // const hasRobots = content.includes('robots')
  const hasLang = content.includes('lang=')
  
  // Count various elements
  const scriptCount = (content.match(/<script[^>]*>/gi) || []).length
  const linkCount = (content.match(/<link[^>]*>/gi) || []).length
  const metaCount = (content.match(/<meta[^>]*>/gi) || []).length
  const styleCount = (content.match(/<style[^>]*>/gi) || []).length
  
  // Check for common issues
  const hasInlineScripts = content.includes('<script>')
  const hasInlineStyles = content.includes('<style>')
  const hasDeprecatedTags = content.includes('<center>') || content.includes('<font>') || content.includes('<marquee>')
  const hasTableLayout = content.includes('<table')
  // const hasDivLayout = content.includes('<div')
  // const hasSemanticTags = content.includes('<header') || content.includes('<nav') || content.includes('<main') || content.includes('<section') || content.includes('<article') || content.includes('<aside') || content.includes('<footer')
  
  // Check for modern web standards
  const hasHTTPS = page.url && page.url.startsWith('https://')
  const hasHTTP2 = page.url && (page.url.includes('http2') || page.url.includes('h2'))
  const hasServiceWorker = content.includes('serviceWorker') || content.includes('sw.js')
  const hasManifest = content.includes('manifest.json') || content.includes('manifest')
  const hasPWA = hasManifest && hasServiceWorker

  const tabs = [
    {
      id: 'structure',
      name: 'HTML Structure',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 'technologies',
      name: 'Technologies',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'keys',
      name: 'Security Keys',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      )
    },
    {
      id: 'standards',
      name: 'Web Standards',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'issues',
      name: 'Issues & Fixes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'structure':
        return (
          <div className="space-y-6">
            {/* Technical Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Score</h3>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-blue-600">
                  {Math.round(((
                    (hasDoctype ? 1 : 0) +
                    (hasHtmlTag ? 1 : 0) +
                    (hasHeadTag ? 1 : 0) +
                    (hasBodyTag ? 1 : 0) +
                    (hasTitleTag ? 1 : 0) +
                    (hasMetaCharset ? 1 : 0) +
                    (hasMetaViewport ? 1 : 0) +
                    (hasLang ? 1 : 0) +
                    (!hasInlineScripts ? 1 : 0) +
                    (!hasDeprecatedTags ? 1 : 0)
                  ) / 10) * 100)}
                </div>
                <div>
                  <div className="text-sm text-gray-600">Out of 100</div>
                  <div className="text-xs text-gray-500">Based on technical standards</div>
                </div>
              </div>
            </div>

            {/* HTML Structure */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">HTML Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Structure</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">DOCTYPE Declaration</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasDoctype ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasDoctype ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">HTML Tag</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasHtmlTag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasHtmlTag ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">HEAD Tag</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasHeadTag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasHeadTag ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">BODY Tag</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasBodyTag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasBodyTag ? 'Present' : 'Missing'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Meta Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Charset Declaration</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasMetaCharset ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasMetaCharset ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Viewport Meta</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasMetaViewport ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasMetaViewport ? 'Present' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Language Attribute</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasLang ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasLang ? 'Present' : 'Missing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Element Counts */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Element Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{scriptCount}</div>
                  <div className="text-sm text-gray-600">Scripts</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{linkCount}</div>
                  <div className="text-sm text-gray-600">Links</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{metaCount}</div>
                  <div className="text-sm text-gray-600">Meta Tags</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{styleCount}</div>
                  <div className="text-sm text-gray-600">Styles</div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'technologies':
        return (
          <TechnologiesTab 
            project={{
              ...page,
              technologies: technologies,
              technologies_metadata: page.technologies_metadata || null
            }} 
          />
        )
      case 'keys':
        return (
          <KeysTab 
            project={{
              ...page,
              all_pages_html: [{
                pageUrl: page.url || page.page_url || 'Unknown URL',
                pageHtml: page.html_content || ''
              }], // Pass only the current page for page-specific analysis
              id: page.id || 'page-analysis'
            }} 
          />
        )
      case 'standards':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Modern Web Standards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Security & Performance</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">HTTPS</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasHTTPS ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasHTTPS ? 'Enabled' : 'Not Enabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">HTTP/2</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasHTTP2 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasHTTP2 ? 'Detected' : 'Not Detected'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Progressive Web App</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Service Worker</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasServiceWorker ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasServiceWorker ? 'Present' : 'Not Found'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Web App Manifest</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasManifest ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasManifest ? 'Present' : 'Not Found'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">PWA Ready</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasPWA ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasPWA ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'issues':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Quality Issues</h3>
              <div className="space-y-3">
                {hasInlineScripts && (
                  <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                    <span className="text-sm text-gray-700">Inline JavaScript</span>
                    <span className="text-sm font-medium text-yellow-800">Found</span>
                  </div>
                )}
                {hasInlineStyles && (
                  <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                    <span className="text-sm text-gray-700">Inline CSS</span>
                    <span className="text-sm font-medium text-yellow-800">Found</span>
                  </div>
                )}
                {hasDeprecatedTags && (
                  <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <span className="text-sm text-gray-700">Deprecated HTML Tags</span>
                    <span className="text-sm font-medium text-red-800">Found</span>
                  </div>
                )}
                {hasTableLayout && (
                  <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                    <span className="text-sm text-gray-700">Table-based Layout</span>
                    <span className="text-sm font-medium text-yellow-800">Detected</span>
                  </div>
                )}
                {!hasInlineScripts && !hasInlineStyles && !hasDeprecatedTags && !hasTableLayout && (
                  <div className="text-center py-8">
                    <div className="text-green-600 font-medium">No issues detected!</div>
                    <div className="text-sm text-gray-500 mt-1">Your code quality looks good</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Recommendations</h3>
              <div className="space-y-3">
                {!hasDoctype && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Add DOCTYPE Declaration</h4>
                    <p className="text-sm text-red-800">
                      Add a proper DOCTYPE declaration at the beginning of your HTML document.
                    </p>
                  </div>
                )}
                {!hasMetaCharset && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Add Charset Declaration</h4>
                    <p className="text-sm text-red-800">
                      Add a charset meta tag to specify the character encoding of your document.
                    </p>
                  </div>
                )}
                {!hasHTTPS && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Enable HTTPS</h4>
                    <p className="text-sm text-red-800">
                      Use HTTPS to secure your website and improve SEO rankings.
                    </p>
                  </div>
                )}
                {hasInlineScripts && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Move JavaScript to External Files</h4>
                    <p className="text-sm text-yellow-800">
                      Move inline JavaScript to external files for better performance and maintainability.
                    </p>
                  </div>
                )}
                {hasDeprecatedTags && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Replace Deprecated Tags</h4>
                    <p className="text-sm text-red-800">
                      Replace deprecated HTML tags with modern alternatives for better compatibility.
                    </p>
                  </div>
                )}
                {hasDoctype && hasMetaCharset && hasHTTPS && !hasInlineScripts && !hasDeprecatedTags && (
                  <div className="text-center py-8">
                    <div className="text-green-600 font-medium">Great job!</div>
                    <div className="text-sm text-gray-500 mt-1">No critical issues found</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}
