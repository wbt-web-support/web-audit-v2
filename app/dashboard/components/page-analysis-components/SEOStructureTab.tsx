'use client'

interface SEOStructureTabProps {
  page: any
}

export default function SEOStructureTab({ page }: SEOStructureTabProps) {
  const content = page.html_content || ''
  const metaTags = page.meta_tags || []
  const socialTags = page.social_meta_tags || []
  
  // SEO Analysis
  const hasTitle = page.title && page.title.trim() !== ''
  const hasDescription = page.description && page.description.trim() !== ''
  const hasH1 = content.includes('<h1>')
  const hasH2 = content.includes('<h2>')
  const hasH3 = content.includes('<h3>')
  const hasCanonical = content.includes('rel="canonical"')
  const hasRobots = content.includes('robots')
  const hasViewport = content.includes('viewport')
  const hasLang = content.includes('lang=')
  
  // Count headings
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length
  
  // Title and description length
  const titleLength = page.title ? page.title.length : 0
  const descriptionLength = page.description ? page.description.length : 0

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Score</h3>
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-bold text-blue-600">
            {Math.round(((
              (hasTitle ? 1 : 0) +
              (hasDescription ? 1 : 0) +
              (hasH1 ? 1 : 0) +
              (hasCanonical ? 1 : 0) +
              (hasRobots ? 1 : 0) +
              (hasViewport ? 1 : 0) +
              (hasLang ? 1 : 0) +
              (h1Count === 1 ? 1 : 0)
            ) / 8) * 100)}
          </div>
          <div>
            <div className="text-sm text-gray-600">Out of 100</div>
            <div className="text-xs text-gray-500">Based on key SEO factors</div>
          </div>
        </div>
      </div>

      {/* Basic SEO Elements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic SEO Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Page Elements</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Page Title</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    hasTitle ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {hasTitle ? 'Present' : 'Missing'}
                  </span>
                  {hasTitle && (
                    <span className="text-xs text-gray-500">({titleLength} chars)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meta Description</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    hasDescription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {hasDescription ? 'Present' : 'Missing'}
                  </span>
                  {hasDescription && (
                    <span className="text-xs text-gray-500">({descriptionLength} chars)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">H1 Tag</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    hasH1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {hasH1 ? 'Present' : 'Missing'}
                  </span>
                  {hasH1 && (
                    <span className="text-xs text-gray-500">({h1Count} found)</span>
                  )}
                </div>
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
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Technical Elements</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Canonical URL</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasCanonical ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasCanonical ? 'Present' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Robots Meta</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasRobots ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasRobots ? 'Present' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Viewport Meta</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasViewport ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasViewport ? 'Present' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heading Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Heading Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{h1Count}</div>
            <div className="text-sm text-gray-600">H1 Tags</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{h2Count}</div>
            <div className="text-sm text-gray-600">H2 Tags</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{h3Count}</div>
            <div className="text-sm text-gray-600">H3 Tags</div>
          </div>
        </div>
        {h1Count === 0 && (
          <div className="mt-4 bg-red-50 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Missing H1 Tag</h4>
            <p className="text-sm text-red-800">
              Every page should have exactly one H1 tag for proper SEO structure.
            </p>
          </div>
        )}
        {h1Count > 1 && (
          <div className="mt-4 bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Multiple H1 Tags</h4>
            <p className="text-sm text-yellow-800">
              You have {h1Count} H1 tags. Consider using only one H1 tag per page for better SEO.
            </p>
          </div>
        )}
      </div>

      {/* Meta Tags */}
      {metaTags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Meta Tags ({metaTags.length})</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {metaTags.map((tag: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {tag.name || tag.property || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {tag.content}
                  </div>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {tag.name ? 'name' : 'property'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Meta Tags */}
      {socialTags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Meta Tags ({socialTags.length})</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {socialTags.map((tag: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {tag.name || tag.property || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {tag.content}
                  </div>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {tag.name ? 'name' : 'property'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Recommendations</h3>
        <div className="space-y-3">
          {!hasTitle && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Page Title</h4>
              <p className="text-sm text-red-800">
                Add a descriptive title tag (50-60 characters) that includes your target keyword.
              </p>
            </div>
          )}
          {!hasDescription && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Meta Description</h4>
              <p className="text-sm text-red-800">
                Add a compelling meta description (150-160 characters) that summarizes your page content.
              </p>
            </div>
          )}
          {!hasH1 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add H1 Tag</h4>
              <p className="text-sm text-red-800">
                Add exactly one H1 tag that describes the main topic of your page.
              </p>
            </div>
          )}
          {!hasViewport && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Viewport Meta Tag</h4>
              <p className="text-sm text-red-800">
                Add a viewport meta tag for proper mobile responsiveness.
              </p>
            </div>
          )}
          {titleLength > 60 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Title Too Long</h4>
              <p className="text-sm text-yellow-800">
                Your title is {titleLength} characters. Consider shortening it to 50-60 characters.
              </p>
            </div>
          )}
          {descriptionLength > 160 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Description Too Long</h4>
              <p className="text-sm text-yellow-800">
                Your description is {descriptionLength} characters. Consider shortening it to 150-160 characters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
