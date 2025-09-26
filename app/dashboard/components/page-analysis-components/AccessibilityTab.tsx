'use client'

interface AccessibilityTabProps {
  page: {
    html_content: string | null;
    title: string | null;
    description: string | null;
    images: Array<{ alt?: string; src: string }> | null;
  }
}

export default function AccessibilityTab({ page }: AccessibilityTabProps) {
  const content = page.html_content || ''
  const images = page.images || []
  
  // Accessibility Analysis
  const hasTitle = page.title && page.title.trim() !== ''
  const hasDescription = page.description && page.description.trim() !== ''
  const hasH1 = content.includes('<h1>')
  // const hasH2 = content.includes('<h2>')
  // const hasH3 = content.includes('<h3>')
  const hasLang = content.includes('lang=')
  const hasViewport = content.includes('viewport')
  const hasAltText = images.some((img: { alt?: string; src: string }) => img.alt && img.alt.trim() !== '')
  const hasTitleAttributes = content.includes('title=')
  const hasLabels = content.includes('<label')
  const hasFormElements = content.includes('<form') || content.includes('<input') || content.includes('<select') || content.includes('<textarea')
  // const hasButtons = content.includes('<button')
  // const hasLinks = content.includes('<a')
  const hasLists = content.includes('<ul>') || content.includes('<ol>')
  // const hasTables = content.includes('<table')
  const hasTableHeaders = content.includes('<th>')
  // const hasTableCaptions = content.includes('<caption>')
  const hasSkipLinks = content.includes('skip') || content.includes('skip-to')
  const hasARIALabels = content.includes('aria-label') || content.includes('aria-labelledby')
  const hasARIAExpanded = content.includes('aria-expanded')
  const hasARIAControls = content.includes('aria-controls')
  const hasARIADescribedBy = content.includes('aria-describedby')
  const hasRoleAttributes = content.includes('role=')
  const hasTabIndex = content.includes('tabindex')
  const hasFocusManagement = content.includes('focus') || content.includes('blur')
  
  // Count accessibility elements
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length
  const imageCount = images.length
  const imagesWithAlt = images.filter((img: { alt?: string; src: string }) => img.alt && img.alt.trim() !== '').length
  const imagesWithoutAlt = imageCount - imagesWithAlt
  const linkCount = (content.match(/<a[^>]*>/gi) || []).length
  const buttonCount = (content.match(/<button[^>]*>/gi) || []).length
  const formCount = (content.match(/<form[^>]*>/gi) || []).length
  const labelCount = (content.match(/<label[^>]*>/gi) || []).length
  const inputCount = (content.match(/<input[^>]*>/gi) || []).length
  
  // Calculate accessibility score
  const accessibilityScore = Math.round((
    (hasTitle ? 1 : 0) +
    (hasDescription ? 1 : 0) +
    (hasH1 ? 1 : 0) +
    (hasLang ? 1 : 0) +
    (hasViewport ? 1 : 0) +
    (hasAltText ? 1 : 0) +
    (hasLabels ? 1 : 0) +
    (hasTableHeaders ? 1 : 0) +
    (hasARIALabels ? 1 : 0) +
    (hasRoleAttributes ? 1 : 0)
  ) / 10 * 100)

  return (
    <div className="space-y-6">
      {/* Accessibility Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Score</h3>
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-bold text-blue-600">{accessibilityScore}</div>
          <div>
            <div className="text-sm text-gray-600">Out of 100</div>
            <div className="text-xs text-gray-500">Based on WCAG guidelines</div>
          </div>
        </div>
      </div>

      {/* Basic Accessibility Elements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Accessibility Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Page Structure</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Page Title</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasTitle ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasTitle ? 'Present' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meta Description</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasDescription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasDescription ? 'Present' : 'Missing'}
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
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Content Structure</h4>
            <div className="space-y-2">
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
                <span className="text-sm text-gray-600">H2 Tags</span>
                <span className="text-sm font-medium text-blue-600">{h2Count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">H3 Tags</span>
                <span className="text-sm font-medium text-blue-600">{h3Count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lists</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasLists ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasLists ? 'Present' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{linkCount}</div>
            <div className="text-sm text-gray-600">Links</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{buttonCount}</div>
            <div className="text-sm text-gray-600">Buttons</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formCount}</div>
            <div className="text-sm text-gray-600">Forms</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inputCount}</div>
            <div className="text-sm text-gray-600">Inputs</div>
          </div>
        </div>
      </div>

      {/* Image Accessibility */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Accessibility</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Alt Text Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Images</span>
                <span className="text-sm font-medium text-blue-600">{imageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">With Alt Text</span>
                <span className={`text-sm font-medium ${
                  imagesWithAlt === imageCount ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {imagesWithAlt}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Without Alt Text</span>
                <span className={`text-sm font-medium ${
                  imagesWithoutAlt === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {imagesWithoutAlt}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Accessibility Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Alt Text Coverage</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  imagesWithAlt === imageCount ? 'bg-green-100 text-green-800' :
                  imagesWithAlt > imageCount * 0.8 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {imageCount > 0 ? Math.round((imagesWithAlt / imageCount) * 100) : 0}%
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

      {/* Form Accessibility */}
      {hasFormElements && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Accessibility</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Form Elements</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Forms</span>
                  <span className="text-sm font-medium text-blue-600">{formCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inputs</span>
                  <span className="text-sm font-medium text-blue-600">{inputCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Labels</span>
                  <span className="text-sm font-medium text-blue-600">{labelCount}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Accessibility Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Label Coverage</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    labelCount >= inputCount ? 'bg-green-100 text-green-800' :
                    labelCount > inputCount * 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {inputCount > 0 ? Math.round((labelCount / inputCount) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ARIA Labels</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    hasARIALabels ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {hasARIALabels ? 'Present' : 'Not Found'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARIA and Advanced Accessibility */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Accessibility Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">ARIA Attributes</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ARIA Labels</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasARIALabels ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasARIALabels ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ARIA Expanded</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasARIAExpanded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasARIAExpanded ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ARIA Controls</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasARIAControls ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasARIAControls ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ARIA Described By</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasARIADescribedBy ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasARIADescribedBy ? 'Present' : 'None'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Navigation & Focus</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role Attributes</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasRoleAttributes ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasRoleAttributes ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tab Index</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasTabIndex ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasTabIndex ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Skip Links</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasSkipLinks ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasSkipLinks ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Focus Management</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasFocusManagement ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasFocusManagement ? 'Present' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Recommendations</h3>
        <div className="space-y-3">
          {!hasTitle && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Page Title</h4>
              <p className="text-sm text-red-800">
                Add a descriptive title tag for better screen reader support and SEO.
              </p>
            </div>
          )}
          {!hasLang && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Language Attribute</h4>
              <p className="text-sm text-red-800">
                Add a lang attribute to the HTML tag to help screen readers pronounce content correctly.
              </p>
            </div>
          )}
          {!hasH1 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add H1 Tag</h4>
              <p className="text-sm text-red-800">
                Add exactly one H1 tag to provide a clear page structure for screen readers.
              </p>
            </div>
          )}
          {imagesWithoutAlt > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Alt Text to Images</h4>
              <p className="text-sm text-red-800">
                {imagesWithoutAlt} images are missing alt text. Add descriptive alt text for better accessibility.
              </p>
            </div>
          )}
          {hasFormElements && labelCount < inputCount && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Form Labels</h4>
              <p className="text-sm text-red-800">
                Some form inputs are missing labels. Add proper labels for better accessibility.
              </p>
            </div>
          )}
          {!hasARIALabels && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Add ARIA Labels</h4>
              <p className="text-sm text-yellow-800">
                Consider adding ARIA labels to improve screen reader support for interactive elements.
              </p>
            </div>
          )}
          {!hasSkipLinks && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Add Skip Links</h4>
              <p className="text-sm text-yellow-800">
                Add skip links to help keyboard users navigate to main content quickly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
