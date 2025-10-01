'use client'

import React from 'react'
import DynamicImage from './DynamicImage'

interface ImageData {
  url?: string
  src?: string
  alt?: string | null
  title?: string | null
  width?: number
  height?: number
  type?: string
  page_url?: string
}

interface MemoizedImageRowProps {
  img: ImageData
  index: number
  onImageClick: (image: ImageData) => void
}

const MemoizedImageRow = React.memo(({ img, index, onImageClick }: MemoizedImageRowProps) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div 
          className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => onImageClick(img)}
        >
          <DynamicImage
            src={img.url || img.src || ''}
            alt={img.alt || 'No alt text'}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            onError={() => {
              // Error handling is already built into DynamicImage component
            }}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs truncate">
          <a
            href={img.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {img.url}
          </a>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs">
          {img.alt && img.alt.trim() !== '' ? (
            <span className="text-sm text-gray-900">{img.alt}</span>
          ) : (
            <span className="text-sm text-gray-500 italic">No alt text</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-900 rounded-full">
          {img.type || 'Unknown'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {img.width && img.height ? `${img.width}×${img.height}` : 'N/A'}
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs truncate">
          <a
            href={img.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {img.page_url}
          </a>
        </div>
      </td>
    </tr>
  )
})

MemoizedImageRow.displayName = 'MemoizedImageRow'

export default MemoizedImageRow
