'use client'

import React from 'react'

interface LinkData {
  url: string
  text: string | null
  title: string | null
  type: 'internal' | 'external'
  page_url?: string
  target?: string
  rel?: string
}

interface MemoizedLinkRowProps {
  link: LinkData
}

const MemoizedLinkRow = React.memo(({ link }: MemoizedLinkRowProps) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <div className="text-sm font-medium text-gray-900 truncate">
            {link.text || 'No text'}
          </div>
          {link.title && (
            <div className="text-sm text-gray-500 truncate" title={link.title}>
              {link.title}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm truncate block"
          >
            {link.url}
          </a>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          link.type === 'internal' 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-gray-200 text-gray-900'
        }`}>
          {link.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {link.target || '_self'}
      </td>
      <td className="px-6 py-4">
        <div className="max-w-xs truncate">
          <a
            href={link.page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {link.page_url}
          </a>
        </div>
      </td>
    </tr>
  )
})

MemoizedLinkRow.displayName = 'MemoizedLinkRow'

export default MemoizedLinkRow
