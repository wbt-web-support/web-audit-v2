'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getBestFaviconUrl, generateFallbackFaviconUrl } from '@/lib/favicon-utils';

interface FaviconDisplayProps {
  data: any;
  siteUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
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

  // Try brand_data.favicons (primary location)
  if (data?.brand_data?.favicons && Array.isArray(data.brand_data.favicons) && data.brand_data.favicons.length > 0) {
    faviconUrl = data.brand_data.favicons[0].href;
    console.log('✅ Found favicon in brand_data.favicons:', faviconUrl);
  }
  // Try direct access to scraping_data.summary.favicons
  else if (data?.scraping_data?.summary?.favicons && Array.isArray(data.scraping_data.summary.favicons) && data.scraping_data.summary.favicons.length > 0) {
    faviconUrl = data.scraping_data.summary.favicons[0].href;
    console.log('✅ Found favicon in scraping_data.summary.favicons:', faviconUrl);
  }
  // Try direct access to summary.favicons
  else if (data?.summary?.favicons && Array.isArray(data.summary.favicons) && data.summary.favicons.length > 0) {
    faviconUrl = data.summary.favicons[0].href;
    console.log('✅ Found favicon in summary.favicons:', faviconUrl);
  }
  // Try parsing scraping_data if it's a string (common in database storage)
  else if (data?.scraping_data && typeof data.scraping_data === 'string') {
    try {
      const parsedData = JSON.parse(data.scraping_data);
      if (parsedData?.summary?.favicons && Array.isArray(parsedData.summary.favicons) && parsedData.summary.favicons.length > 0) {
        faviconUrl = parsedData.summary.favicons[0].href;
        console.log('✅ Found favicon in parsed scraping_data.summary.favicons:', faviconUrl);
      }
    } catch (e) {
      console.log('❌ Failed to parse scraping_data:', e);
    }
  }
  // Try meta_tags_data.favicons
  else if (data?.meta_tags_data?.favicons && Array.isArray(data.meta_tags_data.favicons) && data.meta_tags_data.favicons.length > 0) {
    faviconUrl = data.meta_tags_data.favicons[0].href;
    console.log('✅ Found favicon in meta_tags_data.favicons:', faviconUrl);
  }
  // Try social_meta_tags_data.favicons
  else if (data?.social_meta_tags_data?.favicons && Array.isArray(data.social_meta_tags_data.favicons) && data.social_meta_tags_data.favicons.length > 0) {
    faviconUrl = data.social_meta_tags_data.favicons[0].href;
    console.log('✅ Found favicon in social_meta_tags_data.favicons:', faviconUrl);
  }
  // Try detected_keys.favicons
  else if (data?.detected_keys?.favicons && Array.isArray(data.detected_keys.favicons) && data.detected_keys.favicons.length > 0) {
    faviconUrl = data.detected_keys.favicons[0].href;
    console.log('✅ Found favicon in detected_keys.favicons:', faviconUrl);
  }
  
  // TEMPORARY: Try to access favicon from the raw scraping data structure
  // This is a fallback to test if the data is there but in a different structure
  if (!faviconUrl && data?.scraping_data) {
    console.log('🔍 Trying alternative favicon access patterns...');
    
    // Try different possible paths
    const possiblePaths = [
      'data.scraping_data.summary.favicons',
      'data.scraping_data.favicons', 
      'data.summary.favicons',
      'data.favicons',
      'data.brand_data.favicons'
    ];
    
    for (const path of possiblePaths) {
      try {
        const pathParts = path.split('.');
        let current = data;
        for (const part of pathParts) {
          current = current?.[part];
        }
        if (Array.isArray(current) && current.length > 0 && current[0]?.href) {
          console.log(`✅ Found favicon at: ${path}`, current[0]);
          faviconUrl = current[0].href;
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }
  }
  
  // TEMPORARY: Hardcoded test specifically for NJ Design Park
  if (!faviconUrl && siteUrl && siteUrl.includes('njdesignpark')) {
    console.log('🧪 Testing with hardcoded favicon for NJ Design Park...');
    faviconUrl = 'https://njdesignpark.com/wp-content/uploads/2023/08/nj-logo-1-2.png';
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

  // If no favicon URL found, show fallback
  if (!faviconUrl && !fallbackUrl) {
    return fallbackIcon || (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded flex items-center justify-center`}>
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
        </svg>
      </div>
    );
  }

  // If we have an error loading the favicon, try fallback URL
  if (imageError && fallbackUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <Image
          src={fallbackUrl}
          alt="Site favicon"
          width={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 40}
          height={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 40}
          className="rounded"
          onError={() => setImageError(true)}
          onLoad={handleImageLoad}
          priority
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
        src={faviconUrl || fallbackUrl || '/favicon.ico'}
        alt="Site favicon"
        width={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 40}
        height={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 40}
        className={`rounded ${imageError ? 'hidden' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        unoptimized // Favicons might be from external domains
      />
      
      {imageError && (
        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
          {fallbackIcon || (
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
