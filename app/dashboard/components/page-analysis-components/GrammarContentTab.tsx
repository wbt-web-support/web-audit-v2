'use client'

interface GrammarContentTabProps {
  page: any
}

export default function GrammarContentTab({ page }: GrammarContentTabProps) {
  const content = page.html_content || ''
  const textContent = content.replace(/<[^>]*>/g, '').trim()
  const wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length
  const sentenceCount = textContent.split(/[.!?]+/).filter((sentence: string) => sentence.trim().length > 0).length
  const paragraphCount = textContent.split(/\n\s*\n/).filter((para: string) => para.trim().length > 0).length

  // Basic content analysis
  const hasTitle = page.title && page.title.trim() !== ''
  const hasDescription = page.description && page.description.trim() !== ''
  const hasHeadings = content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>')
  const hasLists = content.includes('<ul>') || content.includes('<ol>')
  const hasStrongTags = content.includes('<strong>') || content.includes('<b>')
  const hasEmTags = content.includes('<em>') || content.includes('<i>')

  return (
    <div className="space-y-6">
      {/* Content Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
          <div className="text-sm text-gray-600">Words</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{sentenceCount}</div>
          <div className="text-sm text-gray-600">Sentences</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{paragraphCount}</div>
          <div className="text-sm text-gray-600">Paragraphs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {wordCount > 0 ? Math.round(sentenceCount / wordCount * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">Readability</div>
        </div>
      </div>

      {/* Content Structure Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Structure Elements</h4>
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
                <span className="text-sm text-gray-600">Headings (H1-H3)</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasHeadings ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasHeadings ? 'Present' : 'Missing'}
                </span>
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
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Content Quality</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bold Text</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasStrongTags ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasStrongTags ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Italic Text</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasEmTags ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hasEmTags ? 'Present' : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Content Length</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  wordCount >= 300 ? 'bg-green-100 text-green-800' :
                  wordCount >= 150 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {wordCount >= 300 ? 'Good' : wordCount >= 150 ? 'Fair' : 'Short'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Preview</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {textContent.substring(0, 1000)}
            {textContent.length > 1000 && '...'}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Showing first 1000 characters of {textContent.length} total characters
        </div>
      </div>

      {/* Content Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Recommendations</h3>
        <div className="space-y-3">
          {!hasTitle && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Page Title</h4>
              <p className="text-sm text-red-800">
                This page is missing a title. Add a descriptive title for better SEO and user experience.
              </p>
            </div>
          )}
          {!hasDescription && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Add Meta Description</h4>
              <p className="text-sm text-red-800">
                Add a meta description to help search engines understand your page content.
              </p>
            </div>
          )}
          {!hasHeadings && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Add Headings</h4>
              <p className="text-sm text-yellow-800">
                Use headings (H1, H2, H3) to structure your content and improve readability.
              </p>
            </div>
          )}
          {wordCount < 150 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Expand Content</h4>
              <p className="text-sm text-yellow-800">
                Consider adding more content. Pages with at least 300 words tend to perform better in search results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
