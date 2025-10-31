'use client';

import { useState } from 'react';
import Image from 'next/image';
import { generateFallbackFaviconUrl } from '@/lib/favicon-utils';

interface FaviconDisplayProps {
  data: Record<string, any>;
  siteUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

// Helper function to find the best favicon from an array
// Prioritizes non-default favicons, prefers PNG over ICO
function findBestFavicon(favicons: any[]): string | null {
  if (!favicons || favicons.length === 0) return null;
  
  // Filter out default favicons and find the best match
  const nonDefault = favicons.filter((fav) => !fav.isDefault && fav.href);
  if (nonDefault.length > 0) {
    // Prefer PNG/WebP over ICO
    const pngFavicon = nonDefault.find((fav) => 
      fav.href && (fav.href.includes('.png') || fav.href.includes('.webp'))
    );
    if (pngFavicon) return pngFavicon.href;
    return nonDefault[0].href;
  }
  
  // Fallback to any favicon
  const anyFavicon = favicons.find((fav) => fav.href);
  return anyFavicon?.href || null;
}

export default function FaviconDisplay({ 
  data, 
  siteUrl, 
  size = 'md', 
  className = '',
  fallbackIcon
}: FaviconDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced favicon extraction with multiple fallback paths
  let faviconUrl = null;
  
  // Helper to extract favicons from various data structures
  const extractFavicons = (source: any): any[] | null => {
    if (!source) return null;
    if (Array.isArray(source.favicons)) return source.favicons;
    if (source.summary && Array.isArray(source.summary.favicons)) return source.summary.favicons;
    return null;
  };

  // Try brand_data.favicons (primary location)
  const brandFavicons = extractFavicons(data?.brand_data);
  if (brandFavicons && brandFavicons.length > 0) {
    faviconUrl = findBestFavicon(brandFavicons);
    if (faviconUrl) console.log('✅ Found favicon in brand_data.favicons:', faviconUrl);
  }
  
  // Try scraping_data - handle both object and string formats
  if (!faviconUrl && data?.scraping_data) {
    let scrapingData = data.scraping_data;
    
    // If it's a string, try to parse it
    if (typeof scrapingData === 'string') {
      try {
        scrapingData = JSON.parse(scrapingData);
      } catch {
        console.log('❌ Failed to parse scraping_data');
      }
    }
    
    // Extract favicons from parsed scraping_data
    const scrapingFavicons = extractFavicons(scrapingData);
    if (scrapingFavicons && scrapingFavicons.length > 0) {
      faviconUrl = findBestFavicon(scrapingFavicons);
      if (faviconUrl) console.log('✅ Found favicon in scraping_data:', faviconUrl);
    }
  }
  
  // Try direct access to summary.favicons
  const summaryFavicons = extractFavicons(data?.summary);
  if (!faviconUrl && summaryFavicons && summaryFavicons.length > 0) {
    faviconUrl = findBestFavicon(summaryFavicons);
    if (faviconUrl) console.log('✅ Found favicon in summary.favicons:', faviconUrl);
  }
  
  // Try meta_tags_data.favicons
  if (!faviconUrl && data?.meta_tags_data?.favicons && Array.isArray(data.meta_tags_data.favicons) && data.meta_tags_data.favicons.length > 0) {
    faviconUrl = findBestFavicon(data.meta_tags_data.favicons);
    if (faviconUrl) console.log('✅ Found favicon in meta_tags_data.favicons:', faviconUrl);
  }
  
  // Try social_meta_tags_data.favicons
  if (!faviconUrl && data?.social_meta_tags_data?.favicons && Array.isArray(data.social_meta_tags_data.favicons) && data.social_meta_tags_data.favicons.length > 0) {
    faviconUrl = findBestFavicon(data.social_meta_tags_data.favicons);
    if (faviconUrl) console.log('✅ Found favicon in social_meta_tags_data.favicons:', faviconUrl);
  }
  
  // Try detected_keys.favicons
  if (!faviconUrl && data?.detected_keys?.favicons && Array.isArray(data.detected_keys.favicons) && data.detected_keys.favicons.length > 0) {
    faviconUrl = findBestFavicon(data.detected_keys.favicons);
    if (faviconUrl) console.log('✅ Found favicon in detected_keys.favicons:', faviconUrl);
  }
  
  const fallbackUrl = siteUrl ? generateFallbackFaviconUrl(siteUrl) : null;
  
  // Debug: Log the fallback URL for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Fallback URL generated:', fallbackUrl);
    console.log('🔍 Site URL:', siteUrl);
  }

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 FaviconDisplay Debug for:', siteUrl);
    console.log('📊 Full Data Object:', data);
    console.log('📊 Data Keys:', Object.keys(data || {}));
    console.log('📊 Brand Data:', data?.brand_data);
    console.log('📊 Brand Data Keys:', Object.keys(data?.brand_data || {}));
    console.log('📊 Favicons in Brand Data:', data?.brand_data?.favicons);
    console.log('📊 Favicons Length:', data?.brand_data?.favicons?.length);
    console.log('📊 First Favicon:', data?.brand_data?.favicons?.[0]);
    console.log('📊 Scraping Data:', data?.scraping_data);
    console.log('📊 Scraping Data Keys:', Object.keys(data?.scraping_data || {}));
    console.log('📊 Summary:', data?.scraping_data?.summary);
    console.log('📊 Summary Keys:', Object.keys(data?.scraping_data?.summary || {}));
    console.log('📊 Favicons Array:', data?.scraping_data?.summary?.favicons);
    console.log('📊 Favicons Length:', data?.scraping_data?.summary?.favicons?.length);
    console.log('📊 First Favicon:', data?.scraping_data?.summary?.favicons?.[0]);
    console.log('📊 Extracted Favicon URL:', faviconUrl);
    console.log('📊 Fallback URL:', fallbackUrl);
    console.log('📊 Site URL:', siteUrl);
    
    // Additional debugging - check if data has any favicon-related fields
    console.log('🔍 Checking for any favicon-related data...');
    const dataStr = JSON.stringify(data, null, 2);
    if (dataStr.includes('favicon') || dataStr.includes('icon')) {
      console.log('✅ Found favicon-related data in project!');
      console.log('📊 Raw data string (first 1000 chars):', dataStr.substring(0, 1000));
    } else {
      console.log('❌ No favicon-related data found in project');
    }
    
    // Special check for NJ Design Park
    if (siteUrl && siteUrl.includes('njdesignpark')) {
      console.log('🎯 Special debugging for NJ Design Park project:');
      console.log('📊 Project ID:', data?.id);
      console.log('📊 Project Status:', data?.status);
      console.log('📊 Has Scraping Data:', !!data?.scraping_data);
      console.log('📊 Scraping Data Type:', typeof data?.scraping_data);
      
      // Try to find any favicon data in the entire project object
      const searchForFavicon = (obj: any, path: string = ''): void => {
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const currentPath = path ? `${path}.${key}` : key;
            if (key.toLowerCase().includes('favicon') || key.toLowerCase().includes('icon')) {
              console.log(`🎯 Found favicon-related key at ${currentPath}:`, obj[key]);
            }
            if (typeof obj[key] === 'object') {
              searchForFavicon(obj[key], currentPath);
            }
          }
        }
      };
      
      searchForFavicon(data);
    }
    
    // Additional debugging - check if scraping_data is a string that needs parsing
    if (data?.scraping_data && typeof data.scraping_data === 'string') {
      console.log('⚠️ Scraping data is a string, trying to parse...');
      try {
        const parsedData = JSON.parse(data.scraping_data);
        console.log('📊 Parsed Scraping Data:', parsedData);
        console.log('📊 Parsed Summary:', parsedData?.summary);
        console.log('📊 Parsed Favicons:', parsedData?.summary?.favicons);
        if (parsedData?.summary?.favicons && Array.isArray(parsedData.summary.favicons) && parsedData.summary.favicons.length > 0) {
          console.log('✅ Found favicon in parsed data!', parsedData.summary.favicons[0]);
          faviconUrl = parsedData.summary.favicons[0].href;
        }
      } catch (e) {
        console.log('❌ Failed to parse scraping_data:', e);
      }
    }
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-10 h-10'
  } as const;

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If no favicon URL found, show fallback (Font Awesome-like globe icon)
  if (!faviconUrl && !fallbackUrl) {
    return fallbackIcon || (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded flex items-center justify-center`}>
        <svg className="w-3 h-3 text-gray-500" viewBox="0 0 512 512" aria-hidden="true">
          <path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm186.7 152h-70.6c-10.6-41.2-26.6-76.8-46.2-104.2 48.2 19.4 88.2 57.2 116.8 104.2zM256 48c27.1 0 61.1 37.9 80.7 112H175.3C194.9 85.9 228.9 48 256 48zM122.1 55.8C102.5 83.2 86.5 118.8 75.9 160H5.3c28.6-47 68.6-84.8 116.8-104.2zM48 256c0-17 1.8-33.7 5.1-49.6h78.2c-1.7 16-2.6 32.7-2.6 49.6s.9 33.6 2.6 49.6H53.1C49.8 289.7 48 273 48 256zm19.9 96h70.6c10.6 41.2 26.6 76.8 46.2 104.2C136.6 436.8 96.6 399 68 352zM256 464c-27.1 0-61.1-37.9-80.7-112h161.4C317.1 426.1 283.1 464 256 464zm80-144H176c-2.7-16.1-4.1-32.8-4.1-49.6s1.5-33.5 4.1-49.6h160c2.7 16.1 4.1 32.8 4.1 49.6s-1.4 33.5-4.1 49.6zm74.1 135.8c19.6-27.4 35.6-63 46.2-104.2h70.6c-28.6 47-68.6 84.8-116.8 104.2zM380.7 256c0-16.9-.9-33.6-2.6-49.6h78.2c3.3 15.9 5.1 32.6 5.1 49.6s-1.8 33.7-5.1 49.6h-78.2c1.7-16 2.6-32.7 2.6-49.6z"/>
        </svg>
      </div>
    );
  }

  // Check if URL is external (needs native img tag) or internal
  const isExternalUrl = (url: string | null): boolean => {
    if (!url) return false;
    // External URLs always start with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Double check it's not our own domain
      try {
        if (typeof window !== 'undefined') {
          const urlObj = new URL(url);
          return urlObj.origin !== window.location.origin;
        }
        return true; // Assume external if window is not available (SSR)
      } catch {
        return true;
      }
    }
    return false; // Relative paths are internal
  };

  const imageSrc = faviconUrl || fallbackUrl || '/favicon.ico';
  const isExternal = isExternalUrl(imageSrc);
  const imageSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 40;

  // If we have an error loading the favicon, try fallback URL
  if (imageError && fallbackUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <Image
          src={fallbackUrl}
          alt="Site favicon"
          width={imageSize}
          height={imageSize}
          className="rounded"
          onError={handleImageError}
          onLoad={handleImageLoad}
          unoptimized={isExternalUrl(fallbackUrl)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded animate-pulse" />
      )}
      
      <Image
        src={imageSrc}
        alt="Site favicon"
        width={imageSize}
        height={imageSize}
        className={`rounded ${imageError ? 'hidden' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        unoptimized={isExternal}
      />
      
      {imageError && (
        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
          {fallbackIcon || (
            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 512 512" aria-hidden="true">
              <path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm186.7 152h-70.6c-10.6-41.2-26.6-76.8-46.2-104.2 48.2 19.4 88.2 57.2 116.8 104.2zM256 48c27.1 0 61.1 37.9 80.7 112H175.3C194.9 85.9 228.9 48 256 48zM122.1 55.8C102.5 83.2 86.5 118.8 75.9 160H5.3c28.6-47 68.6-84.8 116.8-104.2zM48 256c0-17 1.8-33.7 5.1-49.6h78.2c-1.7 16-2.6 32.7-2.6 49.6s.9 33.6 2.6 49.6H53.1C49.8 289.7 48 273 48 256zm19.9 96h70.6c10.6 41.2 26.6 76.8 46.2 104.2C136.6 436.8 96.6 399 68 352zM256 464c-27.1 0-61.1-37.9-80.7-112h161.4C317.1 426.1 283.1 464 256 464zm80-144H176c-2.7-16.1-4.1-32.8-4.1-49.6s1.5-33.5 4.1-49.6h160c2.7 16.1 4.1 32.8 4.1 49.6s-1.4 33.5-4.1 49.6zm74.1 135.8c19.6-27.4 35.6-63 46.2-104.2h70.6c-28.6 47-68.6 84.8-116.8 104.2zM380.7 256c0-16.9-.9-33.6-2.6-49.6h78.2c3.3 15.9 5.1 32.6 5.1 49.6s-1.8 33.7-5.1 49.6h-78.2c1.7-16 2.6-32.7 2.6-49.6z"/>
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
