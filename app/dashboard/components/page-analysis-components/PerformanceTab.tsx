'use client'

interface PerformanceTabProps {
  page: any
}

export default function PerformanceTab({ page }: PerformanceTabProps) {
  const content = page.html_content || ''
  const images = page.images || []
  
  // Performance Analysis
  const responseTime = page.response_time || 0
  const contentLength = page.html_content_length || 0
  const imageCount = images.length
  const largeImages = images.filter((img: any) => img.size && img.size > 100000) // > 100KB
  const totalImageSize = images.reduce((total: number, img: any) => total + (img.size || 0), 0)
  
  // Check for performance optimizations
  const hasLazyLoading = images.some((img: any) => img.loading === 'lazy')
  const hasModernFormats = images.some((img: any) => img.format && ['webp', 'avif'].includes(img.format.toLowerCase()))
  const hasCompressedImages = images.some((img: any) => img.size && img.size < 50000) // < 50KB
  const hasAsyncScripts = content.includes('async') || content.includes('defer')
  const hasMinifiedCSS = content.includes('min.css') || content.includes('.min.')
  const hasMinifiedJS = content.includes('min.js') || content.includes('.min.')
  const hasCDN = content.includes('cdn') || content.includes('cloudflare') || content.includes('jsdelivr')
  const hasGzip = page.content_encoding && page.content_encoding.includes('gzip')
  
  // Calculate performance score
  const performanceScore = Math.round((
    (responseTime < 1000 ? 1 : responseTime < 2000 ? 0.5 : 0) +
    (contentLength < 100000 ? 1 : contentLength < 500000 ? 0.5 : 0) +
    (largeImages.length === 0 ? 1 : largeImages.length < imageCount * 0.3 ? 0.5 : 0) +
    (hasLazyLoading ? 1 : 0) +
    (hasModernFormats ? 1 : 0) +
    (hasAsyncScripts ? 1 : 0) +
    (hasMinifiedCSS ? 1 : 0) +
    (hasMinifiedJS ? 1 : 0) +
    (hasCDN ? 1 : 0) +
    (hasGzip ? 1 : 0)
  ) / 10 * 100)

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Score</h3>
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-bold text-blue-600">{performanceScore}</div>
          <div>
            <div className="text-sm text-gray-600">Out of 100</div>
            <div className="text-xs text-gray-500">Based on performance metrics</div>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{responseTime}ms</div>
          <div className="text-sm text-gray-600">Response Time</div>
          <div className={`text-xs mt-1 ${
            responseTime < 1000 ? 'text-green-600' : responseTime < 2000 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {responseTime < 1000 ? 'Excellent' : responseTime < 2000 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{(contentLength / 1024).toFixed(1)}KB</div>
          <div className="text-sm text-gray-600">Page Size</div>
          <div className={`text-xs mt-1 ${
            contentLength < 100000 ? 'text-green-600' : contentLength < 500000 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {contentLength < 100000 ? 'Excellent' : contentLength < 500000 ? 'Good' : 'Large'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{imageCount}</div>
          <div className="text-sm text-gray-600">Images</div>
          <div className={`text-xs mt-1 ${
            imageCount < 10 ? 'text-green-600' : imageCount < 20 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {imageCount < 10 ? 'Good' : imageCount < 20 ? 'Moderate' : 'Many'}
          </div>
        </div>
      </div>

      {/* Image Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Image Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Images</span>
                <span className="text-sm font-medium text-blue-600">{imageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Large Images (&gt;100KB)</span>
                <span className={`text-sm font-medium ${
                  largeImages.length === 0 ? 'text-green-600' : largeImages.length < imageCount * 0.3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {largeImages.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Image Size</span>
                <span className="text-sm font-medium text-blue-600">
                  {(totalImageSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Image Size</span>
                <span className="text-sm font-medium text-blue-600">
                  {imageCount > 0 ? (totalImageSize / imageCount / 1024).toFixed(1) : 0} KB
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Optimization Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lazy Loading</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasLazyLoading ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasLazyLoading ? 'Enabled' : 'Not Enabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Modern Formats</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasModernFormats ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasModernFormats ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compressed Images</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasCompressedImages ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasCompressedImages ? 'Present' : 'Not Found'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Optimization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Scripts & Styles</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Async Scripts</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasAsyncScripts ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasAsyncScripts ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minified CSS</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasMinifiedCSS ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasMinifiedCSS ? 'Present' : 'Not Found'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minified JS</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasMinifiedJS ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasMinifiedJS ? 'Present' : 'Not Found'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Delivery & Compression</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CDN Usage</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasCDN ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasCDN ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gzip Compression</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  hasGzip ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasGzip ? 'Enabled' : 'Not Enabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          {responseTime > 2000 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Improve Response Time</h4>
              <p className="text-sm text-red-800">
                Your response time is {responseTime}ms. Consider optimizing server performance, using a CDN, or reducing server-side processing.
              </p>
            </div>
          )}
          {largeImages.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Optimize Large Images</h4>
              <p className="text-sm text-yellow-800">
                {largeImages.length} images are larger than 100KB. Consider compressing them or using modern formats like WebP.
              </p>
            </div>
          )}
          {!hasLazyLoading && imageCount > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Enable Lazy Loading</h4>
              <p className="text-sm text-yellow-800">
                Enable lazy loading for images to improve initial page load time.
              </p>
            </div>
          )}
          {!hasModernFormats && imageCount > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Use Modern Image Formats</h4>
              <p className="text-sm text-blue-800">
                Consider using WebP or AVIF formats for better compression and faster loading.
              </p>
            </div>
          )}
          {!hasAsyncScripts && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Use Async Scripts</h4>
              <p className="text-sm text-yellow-800">
                Load JavaScript asynchronously to prevent blocking page rendering.
              </p>
            </div>
          )}
          {!hasGzip && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Enable Gzip Compression</h4>
              <p className="text-sm text-yellow-800">
                Enable gzip compression to reduce file sizes and improve loading speed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
