'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-client';

interface FaviconDisplayProps {
  // Backwards compatibility: callers may still pass a hydrated project/page object
  data?: Record<string, any>;
  // Preferred explicit project id
  projectId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function FaviconDisplay({
  data,
  projectId,
  size = 'md',
  className = '',
  fallbackIcon
}: FaviconDisplayProps) {
  
  const effectiveProjectId = useMemo(() => {
    return projectId ?? data?.audit_project_id ?? data?.project_id ?? data?.id ?? null;
  }, [projectId, data]);

  const [brandData, setBrandData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function loadBrandData() {
      if (!effectiveProjectId) {
        setBrandData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data: row, error } = await supabase
        .from('audit_projects')
        .select('brand_data')
        .eq('id', effectiveProjectId)
        .single();

      if (!isMounted) return;

      if (error) {
        console.error('Error fetching brand_data:', error);
        setBrandData(null);
      } else {
        let parsed = row?.brand_data ?? null;
        // Handle JSON stored as string
        if (parsed && typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // Keep as string if not JSON
          }
        }
        setBrandData(parsed);
        
      }
      setIsLoading(false);
    }

    loadBrandData();

    return () => {
      isMounted = false;
    };
  }, [effectiveProjectId]);

  // Extract favicon URL from brand_data
  const faviconUrl = useMemo(() => {
    if (!brandData) return null;

    // Get favicons array (prefer direct favicons over summary.favicons)
    let favicons: any[] = [];
    if (Array.isArray(brandData.favicons)) {
      favicons = brandData.favicons;
    } else if (brandData.summary && Array.isArray(brandData.summary.favicons)) {
      favicons = brandData.summary.favicons;
    }

    if (favicons.length === 0) return null;

    // Filter out default favicons and find best match
    const nonDefault = favicons.filter((fav) => !fav.isDefault && fav.href);
    
    if (nonDefault.length === 0) return null;

    // Prefer PNG/SVG over ICO, and prefer "icon" over "apple-touch-icon"
    const priorityOrder = ['png', 'svg', 'webp', 'jpg', 'jpeg'];
    
    // First try to find by file extension priority
    for (const ext of priorityOrder) {
      const favicon = nonDefault.find((fav) => {
        const href = fav.href?.toLowerCase() || '';
        return href.includes(`.${ext}`);
      });
      if (favicon) return favicon.href;
    }

    // If no priority format found, prefer "icon" over "apple-touch-icon"
    const iconFavicon = nonDefault.find((fav) => fav.rel === 'icon');
    if (iconFavicon) return iconFavicon.href;

    // Return first non-default favicon
    return nonDefault[0]?.href || null;
  }, [brandData]);



  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-10 h-10'
  } as const;

  const imageSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 40;

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <div className="absolute inset-0 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // Show fallback if no favicon URL found, image error, no brandData, or no projectId
  if (!faviconUrl || imageError || !brandData || !effectiveProjectId) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded flex items-center justify-center`}>
        {fallbackIcon || (
          <svg className="w-3 h-3 text-gray-500" viewBox="0 0 512 512" aria-hidden="true">
            <path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm186.7 152h-70.6c-10.6-41.2-26.6-76.8-46.2-104.2 48.2 19.4 88.2 57.2 116.8 104.2zM256 48c27.1 0 61.1 37.9 80.7 112H175.3C194.9 85.9 228.9 48 256 48zM122.1 55.8C102.5 83.2 86.5 118.8 75.9 160H5.3c28.6-47 68.6-84.8 116.8-104.2zM48 256c0-17 1.8-33.7 5.1-49.6h78.2c-1.7 16-2.6 32.7-2.6 49.6s.9 33.6 2.6 49.6H53.1C49.8 289.7 48 273 48 256zm19.9 96h70.6c10.6 41.2 26.6 76.8 46.2 104.2C136.6 436.8 96.6 399 68 352zM256 464c-27.1 0-61.1-37.9-80.7-112h161.4C317.1 426.1 283.1 464 256 464zm80-144H176c-2.7 16.1-4.1 32.8-4.1 49.6s1.5-33.5 4.1-49.6h160c2.7 16.1 4.1 32.8 4.1 49.6s-1.4 33.5-4.1 49.6zm74.1 135.8c19.6-27.4 35.6-63 46.2-104.2h70.6c-28.6 47-68.6 84.8-116.8 104.2zM380.7 256c0-16.9-.9-33.6-2.6-49.6h78.2c3.3 15.9 5.1 32.6 5.1 49.6s-1.8 33.7-5.1 49.6h-78.2c1.7-16 2.6-32.7 2.6-49.6z"/>
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src={faviconUrl}
        alt="Site favicon"
        width={imageSize}
        height={imageSize}
        className="rounded"
        onError={handleImageError}
        onLoad={handleImageLoad}
        unoptimized
      />
    </div>
  );
}