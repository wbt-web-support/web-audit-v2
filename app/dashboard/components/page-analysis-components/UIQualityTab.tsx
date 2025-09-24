'use client'

interface UIQualityTabProps {
  page: any
}

export default function UIQualityTab({ page }: UIQualityTabProps) {
  const content = page.html_content || ''
  
  // UI Quality Analysis
  const hasViewport = content.includes('viewport')
  const hasResponsiveDesign = content.includes('responsive') || content.includes('mobile') || content.includes('@media')
  const hasCSS = content.includes('<style') || content.includes('stylesheet')
  const hasJavaScript = content.includes('<script')
  const hasForms = content.includes('<form')
  const hasButtons = content.includes('<button') || content.includes('type="submit"')
  const hasInputs = content.includes('<input')
  const hasLabels = content.includes('<label')
  
  // Count interactive elements
  const formCount = (content.match(/<form[^>]*>/gi) || []).length
  const buttonCount = (content.match(/<button[^>]*>/gi) || []).length
  const inputCount = (content.match(/<input[^>]*>/gi) || []).length
  const labelCount = (content.match(/<label[^>]*>/gi) || []).length
  
  // Check for common UI issues
  const hasInlineStyles = content.includes('style=')
  const hasInlineScripts = content.includes('<script>')
  const hasDeprecatedTags = content.includes('<center>') || content.includes('<font>') || content.includes('<marquee>')
  const hasAltText = content.includes('alt=')
  const hasTitleAttributes = content.includes('title=')
  
  // Color and contrast analysis (basic)
  const hasColorStyles = content.includes('color:') || content.includes('background-color:')
  const hasFontStyles = content.includes('font-family:') || content.includes('font-size:')

  return (
    <div className="space-y-6">
      {/* UI Quality Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">UI Quality Score</h3>
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-bold text-blue-600">
            {Math.round(((
              (hasViewport ? 1 : 0) +
              (hasCSS ? 1 : 0) +
              (hasForms ? 1 : 0) +
              (hasButtons ? 1 : 0) +
              (hasLabels ? 1 : 0) +
              (hasAltText ? 1 : 0) +
              (hasTitleAttributes ? 1 : 0) +
              (!hasInlineStyles ? 1 : 0) +
              (!hasDeprecatedTags ? 1 : 0)
            ) / 9) * 100)}
          </div>
          <div>
            <div className="text-sm text-gray-600">Out of 100</div>
            <div className="text-xs text-gray-500">Based on UI best practices</div>
          </div>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formCount}</div>
            <div className="text-sm text-gray-600">Forms</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{buttonCount}</div>
            <div className="text-sm text-gray-600">Buttons</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inputCount}</div>
            <div className="text-sm text-gray-600">Inputs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{labelCount}</div>
            <div className="text-sm text-gray-600">Labels</div>
          </div>
        </div>
      </div>

      {/* UI Structure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responsive Design */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsive Design</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Viewport Meta Tag</span>
              <span className={`px-2 py-1 rounded text-xs ${
                hasViewport ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {hasViewport ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Responsive CSS</span>
              <span className={`px-2 py-1 rounded text-xs ${
                hasResponsiveDesign ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hasResponsiveDesign ? 'Detected' : 'Not Detected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CSS Files</span>
              <span className={`px-2 py-1 rounded text-xs ${
                hasCSS ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hasCSS ? 'Present' : 'Not Found'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Accessibility */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Accessibility</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Forms Present</span>
              <span className={`px-2 py-1 rounded text-xs ${
                hasForms ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasForms ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Labels Present</span>
              <span className={`px-2 py-1 rounded text-xs ${
                hasLabels ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {hasLabels ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Input Elements</span>
              <span className={`px-2 py-1 rounded text-xs ${
                hasInputs ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {hasInputs ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Quality */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Best Practices</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">External CSS</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasCSS && !hasInlineStyles ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasCSS && !hasInlineStyles ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">External JS</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasJavaScript && !hasInlineScripts ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasJavaScript && !hasInlineScripts ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Alt Text</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasAltText ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasAltText ? 'Present' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Issues Found</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inline Styles</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasInlineStyles ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {hasInlineStyles ? 'Found' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deprecated Tags</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasDeprecatedTags ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {hasDeprecatedTags ? 'Found' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Title Attributes</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasTitleAttributes ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasTitleAttributes ? 'Present' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UI Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">UI Quality Recommendations</h3>
        <div className="space-y-3">
          {!hasViewport && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Viewport Meta Tag</h4>
              <p className="text-sm text-red-800">
                Add a viewport meta tag to ensure proper mobile responsiveness.
              </p>
            </div>
          )}
          {hasInlineStyles && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Move Inline Styles to CSS</h4>
              <p className="text-sm text-yellow-800">
                Consider moving inline styles to external CSS files for better maintainability.
              </p>
            </div>
          )}
          {hasDeprecatedTags && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Remove Deprecated Tags</h4>
              <p className="text-sm text-red-800">
                Replace deprecated HTML tags with modern alternatives for better compatibility.
              </p>
            </div>
          )}
          {hasForms && !hasLabels && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Form Labels</h4>
              <p className="text-sm text-red-800">
                Add proper labels to form inputs for better accessibility and user experience.
              </p>
            </div>
          )}
          {!hasAltText && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Alt Text to Images</h4>
              <p className="text-sm text-red-800">
                Add descriptive alt text to all images for better accessibility.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
