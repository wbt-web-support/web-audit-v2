'use client'

import { useState, useRef, useEffect } from 'react'
import DynamicImage from './DynamicImage'

interface LazyImageProps {
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

export default function LazyImage({
  src,
  alt,
  width = 64,
  height = 64,
  className,
  style,
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  onLoad,
  onError
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(priority) // Load immediately if priority
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, isVisible])

  const handleLoad = () => {
    setHasLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div 
      ref={imgRef}
      className={`relative ${className || ''}`}
      style={{ width, height, ...style }}
    >
      {!isVisible ? (
        // Placeholder while not visible
        <div 
          className="w-full h-full bg-gray-100 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      ) : hasError ? (
        // Error state
        <div 
          className="w-full h-full bg-gray-100 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center">
            <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      ) : (
        // Load the actual image
        <DynamicImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
          style={style}
          priority={priority}
          quality={quality}
          fill={fill}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}
