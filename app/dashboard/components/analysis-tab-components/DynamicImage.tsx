'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface DynamicImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  quality?: number
  fill?: boolean
  sizes?: string
  onLoad?: () => void
  onError?: () => void
}

export default function DynamicImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  onLoad,
  onError
}: DynamicImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
  }, [src])

  const handleError = () => {
    setImageError(true)
    onError?.()
  }

  const handleLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  // If image failed to load, show fallback
  if (imageError) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className || ''}`}
        style={style}
      >
        <div className="text-center p-4">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">Image failed to load</p>
          <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{src}</p>
        </div>
      </div>
    )
  }

  // Check if it's a data URL (base64) or external URL
  const isDataUrl = src.startsWith('data:')
  const isExternalUrl = src.startsWith('http://') || src.startsWith('https://')
  const isRelativeUrl = !isDataUrl && !isExternalUrl

  // For external URLs and relative URLs, use regular img tag to avoid Next.js URL resolution
  if ((isExternalUrl || isRelativeUrl) && !isDataUrl) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    )
  }

  // For data URLs only, use Next.js Image
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        priority={priority}
        quality={quality}
        fill={fill}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={true} // Disable optimization for data URLs
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
