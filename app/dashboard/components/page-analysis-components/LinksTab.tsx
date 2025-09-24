'use client'

interface LinksTabProps {
  page: any
}

export default function LinksTab({ page }: LinksTabProps) {
  const links = page.links || []
  const internalLinks = links.filter((link: any) => link.type === 'internal')
  const externalLinks = links.filter((link: any) => link.type === 'external')

  return (
    <div className="space-y-6">
      {/* Links Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{links.length}</div>
          <div className="text-sm text-gray-600">Total Links</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{internalLinks.length}</div>
          <div className="text-sm text-gray-600">Internal Links</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{externalLinks.length}</div>
          <div className="text-sm text-gray-600">External Links</div>
        </div>
      </div>

      {/* Internal Links */}
      {internalLinks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal Links ({internalLinks.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {internalLinks.map((link: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {link.text || 'No text'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {link.href}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {link.title && (
                    <span className="text-xs text-gray-500" title={link.title}>
                      Title: {link.title}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs ${
                    link.status === 'valid' ? 'bg-green-100 text-green-800' :
                    link.status === 'broken' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {link.status || 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      {externalLinks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">External Links ({externalLinks.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {externalLinks.map((link: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {link.text || 'No text'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {link.href}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {link.title && (
                    <span className="text-xs text-gray-500" title={link.title}>
                      Title: {link.title}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs ${
                    link.status === 'valid' ? 'bg-green-100 text-green-800' :
                    link.status === 'broken' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {link.status || 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Links Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Link Quality Issues</h4>
            <div className="space-y-2">
              {links.filter((link: any) => !link.text || link.text.trim() === '').length > 0 && (
                <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                  <span className="text-sm text-gray-700">Links without text</span>
                  <span className="text-sm font-medium text-yellow-800">
                    {links.filter((link: any) => !link.text || link.text.trim() === '').length}
                  </span>
                </div>
              )}
              {links.filter((link: any) => link.status === 'broken').length > 0 && (
                <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                  <span className="text-sm text-gray-700">Broken links</span>
                  <span className="text-sm font-medium text-red-800">
                    {links.filter((link: any) => link.status === 'broken').length}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Link Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Internal</span>
                <span className="text-sm font-medium text-blue-600">
                  {Math.round((internalLinks.length / links.length) * 100) || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">External</span>
                <span className="text-sm font-medium text-blue-600">
                  {Math.round((externalLinks.length / links.length) * 100) || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
