'use client'

interface ImagesTabProps {
  page: any
}

export default function ImagesTab({ page }: ImagesTabProps) {
  const images = page.images || []
  const imagesWithAlt = images.filter((img: any) => img.alt && img.alt.trim() !== '')
  const imagesWithoutAlt = images.filter((img: any) => !img.alt || img.alt.trim() === '')
  const largeImages = images.filter((img: any) => img.size && img.size > 100000) // > 100KB

  return (
    <div className="space-y-6">
      {/* Images Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{images.length}</div>
          <div className="text-sm text-gray-600">Total Images</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{imagesWithAlt.length}</div>
          <div className="text-sm text-gray-600">With Alt Text</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{imagesWithoutAlt.length}</div>
          <div className="text-sm text-gray-600">Missing Alt Text</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{largeImages.length}</div>
          <div className="text-sm text-gray-600">Large Images</div>
        </div>
      </div>

      {/* Images List */}
      {images.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Images ({images.length})</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {images.map((img: any, index: number) => (
              <div key={index} className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
                <div className="flex-shrink-0">
                  {img.src && (
                    <img 
                      src={img.src} 
                      alt={img.alt || 'Image'} 
                      className="w-16 h-16 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {img.src}
                  </div>
                  {img.alt && (
                    <div className="text-sm text-gray-600 mt-1">
                      Alt: {img.alt}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    {img.width && img.height && (
                      <span>{img.width} × {img.height}</span>
                    )}
                    {img.size && (
                      <span>{(img.size / 1024).toFixed(1)} KB</span>
                    )}
                    <span className={`px-2 py-1 rounded ${
                      img.alt && img.alt.trim() !== '' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {img.alt && img.alt.trim() !== '' ? 'Has Alt' : 'No Alt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accessibility Issues */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Issues</h3>
          <div className="space-y-3">
            {imagesWithoutAlt.length > 0 && (
              <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                <span className="text-sm text-gray-700">Images without alt text</span>
                <span className="text-sm font-medium text-red-800">{imagesWithoutAlt.length}</span>
              </div>
            )}
            {largeImages.length > 0 && (
              <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                <span className="text-sm text-gray-700">Large images (&gt;100KB)</span>
                <span className="text-sm font-medium text-yellow-800">{largeImages.length}</span>
              </div>
            )}
            {images.filter((img: any) => !img.src || img.src.trim() === '').length > 0 && (
              <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                <span className="text-sm text-gray-700">Images without src</span>
                <span className="text-sm font-medium text-red-800">
                  {images.filter((img: any) => !img.src || img.src.trim() === '').length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Issues */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Issues</h3>
          <div className="space-y-3">
            {images.filter((img: any) => !img.loading || img.loading !== 'lazy').length > 0 && (
              <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                <span className="text-sm text-gray-700">Images without lazy loading</span>
                <span className="text-sm font-medium text-yellow-800">
                  {images.filter((img: any) => !img.loading || img.loading !== 'lazy').length}
                </span>
              </div>
            )}
            {images.filter((img: any) => img.format && !['webp', 'avif'].includes(img.format.toLowerCase())).length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <span className="text-sm text-gray-700">Images not in modern format</span>
                <span className="text-sm font-medium text-blue-800">
                  {images.filter((img: any) => img.format && !['webp', 'avif'].includes(img.format.toLowerCase())).length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Optimization Suggestions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Suggestions</h3>
        <div className="space-y-3">
          {imagesWithoutAlt.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Add Alt Text</h4>
              <p className="text-sm text-blue-800">
                {imagesWithoutAlt.length} images are missing alt text. Add descriptive alt text for better accessibility.
              </p>
            </div>
          )}
          {largeImages.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Optimize Large Images</h4>
              <p className="text-sm text-blue-800">
                {largeImages.length} images are larger than 100KB. Consider compressing or using modern formats like WebP.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
