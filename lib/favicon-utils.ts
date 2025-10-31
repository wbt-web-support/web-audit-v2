import { FaviconData } from '@/types/audit';

export interface FaviconExtractionResult {
  favicons: FaviconData[];
  primaryFavicon: string | null;
  appleTouchIcon: string | null;
  defaultFavicon: string | null;
}

/**
 * Extract favicon data from scraping data or project data
 */
export function extractFavicons(data: any): FaviconExtractionResult {
  const result: FaviconExtractionResult = {
    favicons: [],
    primaryFavicon: null,
    appleTouchIcon: null,
    defaultFavicon: null
  };

  // Try to find favicons in different possible locations
  let favicons: FaviconData[] = [];

  // Check if favicons are in summary (primary location)
  if (data?.summary?.favicons && Array.isArray(data.summary.favicons)) {
    favicons = data.summary.favicons;
  }
  // Check if favicons are in scraping_data.summary
  else if (data?.scraping_data?.summary?.favicons && Array.isArray(data.scraping_data.summary.favicons)) {
    favicons = data.scraping_data.summary.favicons;
  }
  // Check if favicons are in meta_tags_data
  else if (data?.meta_tags_data?.favicons && Array.isArray(data.meta_tags_data.favicons)) {
    favicons = data.meta_tags_data.favicons;
  }
  // Check if favicons are in scraping_data.meta_tags_data
  else if (data?.scraping_data?.meta_tags_data?.favicons && Array.isArray(data.scraping_data.meta_tags_data.favicons)) {
    favicons = data.scraping_data.meta_tags_data.favicons;
  }

  result.favicons = favicons;

  // Find the best favicon to display - prioritize first favicon as requested
  if (favicons.length > 0) {
    // Use the first favicon as primary (as requested)
    result.primaryFavicon = favicons[0].href;
    
    // Also set apple-touch-icon if available
    const appleTouchIcon = favicons.find(fav => fav.rel === 'apple-touch-icon');
    if (appleTouchIcon) {
      result.appleTouchIcon = appleTouchIcon.href;
    }

    // Set default favicon if available
    const defaultFavicon = favicons.find(fav => fav.isDefault);
    if (defaultFavicon) {
      result.defaultFavicon = defaultFavicon.href;
    }
  }

  return result;
}

/**
 * Get the best favicon URL for display
 */
export function getBestFaviconUrl(data: any): string | null {
  const result = extractFavicons(data);
  return result.primaryFavicon || result.appleTouchIcon || result.defaultFavicon || null;
}

/**
 * Generate a fallback favicon URL from domain
 * Tries multiple formats in order of preference: PNG, SVG, WebP, then ICO
 */
export function generateFallbackFaviconUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    
    // Try preferred formats first (PNG, SVG, WebP) - return the first one to try
    // The actual checking will be done by the image loader's error handler
    // Priority order: PNG > SVG > WebP > ICO (last resort)
    return `${baseUrl}/favicon.png`;
  } catch {
    return '/favicon.png';
  }
}

/**
 * Generate multiple fallback favicon URLs to try in order
 */
export function generateFallbackFaviconUrls(siteUrl: string): string[] {
  try {
    const url = new URL(siteUrl);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    
    // Return URLs in priority order: PNG > SVG > WebP > ICO (last resort)
    return [
      `${baseUrl}/favicon.png`,
      `${baseUrl}/favicon.svg`,
      `${baseUrl}/favicon.webp`,
      `${baseUrl}/apple-touch-icon.png`, // Also try apple-touch-icon
      `${baseUrl}/favicon.ico` // Last resort
    ];
  } catch {
    return ['/favicon.png', '/favicon.svg', '/favicon.ico'];
  }
}
