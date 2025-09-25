/**
 * HTML Content Filter
 * Filters HTML content to extract only pure text content
 * Removes script tags, style tags, and all HTML tags
 */

export interface FilteredContent {
  pureContent: string;
  wordCount: number;
  characterCount: number;
  filteredLength: number;
}

/**
 * Removes script and style tags from HTML content
 * @param html - Raw HTML content
 * @returns HTML with script and style tags removed
 */
function removeScriptAndStyleTags(html: string): string {
  // Remove script tags and their content
  let filtered = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  filtered = filtered.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove noscript tags and their content
  filtered = filtered.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  
  return filtered;
}

/**
 * Extracts only the body content from HTML
 * @param html - HTML content
 * @returns Body content only
 */
function extractBodyContent(html: string): string {
  // Try to extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  
  // If no body tag found, return the entire content
  return html;
}

/**
 * Removes all HTML tags and extracts pure text content
 * @param html - HTML content
 * @returns Pure text content
 */
function stripHtmlTags(html: string): string {
  // Remove HTML comments
  let text = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities and numeric character references
  text = text
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&bull;/g, '•')
    .replace(/&middot;/g, '·')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&plusmn;/g, '±')
    .replace(/&deg;/g, '°')
    .replace(/&sect;/g, '§')
    .replace(/&para;/g, '¶')
    // Numeric character references (decimal) - handles &#8217; etc.
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
    // Numeric character references (hexadecimal) - handles &#x2019; etc.
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return text;
}

/**
 * Cleans and normalizes text content
 * @param text - Raw text content
 * @returns Cleaned text content
 */
function cleanTextContent(text: string): string {
  // Replace multiple whitespace with single space
  let cleaned = text.replace(/\s+/g, ' ');
  
  // Remove leading and trailing whitespace
  cleaned = cleaned.trim();
  
  // Remove empty lines
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');
  
  return cleaned;
}

/**
 * Main function to filter HTML content and extract pure text
 * @param html - Raw HTML content
 * @returns Filtered content with metadata
 */
export function filterHtmlContent(html: string): FilteredContent {
  console.log('🔧 filterHtmlContent called with:', {
    hasHtml: !!html,
    htmlType: typeof html,
    htmlLength: html?.length || 0,
    htmlPreview: html?.substring(0, 100) + '...'
  });

  if (!html || typeof html !== 'string') {
    console.log('❌ Invalid HTML input provided');
    return {
      pureContent: '',
      wordCount: 0,
      characterCount: 0,
      filteredLength: 0
    };
  }

  try {
    // Step 1: Remove script and style tags
    let filtered = removeScriptAndStyleTags(html);
    
    // Step 2: Extract body content only
    filtered = extractBodyContent(filtered);
    
    // Step 3: Remove all HTML tags
    let pureContent = stripHtmlTags(filtered);
    
    // Step 4: Clean and normalize text
    pureContent = cleanTextContent(pureContent);
    
    // Calculate metrics
    const wordCount = pureContent.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = pureContent.length;
    
    console.log('✅ filterHtmlContent completed:', {
      originalLength: html.length,
      filteredLength: pureContent.length,
      wordCount,
      characterCount,
      contentPreview: pureContent.substring(0, 100) + '...'
    });
    
    return {
      pureContent,
      wordCount,
      characterCount,
      filteredLength: pureContent.length
    };
  } catch (error) {
    console.error('Error filtering HTML content:', error);
    return {
      pureContent: '',
      wordCount: 0,
      characterCount: 0,
      filteredLength: 0
    };
  }
}

/**
 * Quick filter function for simple use cases
 * @param html - Raw HTML content
 * @returns Pure text content only
 */
export function getPureTextContent(html: string): string {
  const filtered = filterHtmlContent(html);
  return filtered.pureContent;
}

/**
 * Check if content is meaningful (not just whitespace or very short)
 * @param content - Text content to check
 * @returns True if content is meaningful
 */
export function isContentMeaningful(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length > 50 && trimmed.split(/\s+/).length > 10;
}
