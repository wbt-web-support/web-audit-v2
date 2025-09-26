export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  fix: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOHighlight {
  type: 'achievement' | 'good-practice' | 'optimization'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOAnalysisResult {
  score: number
  issues: SEOIssue[]
  highlights: SEOHighlight[]
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    info: number
    totalHighlights: number
  }
  recommendations: string[]
}

export function analyzeSEO(htmlContent: string, url: string): SEOAnalysisResult {
  const issues: SEOIssue[] = []
  const highlights: SEOHighlight[] = []
  let score = 100

  // Parse HTML content
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  // Extract URL components for analysis
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    urlObj = new URL('https://example.com')
  }

  // Check title tag
  const title = doc.querySelector('title')
  if (!title || !title.textContent?.trim()) {
    issues.push({
      type: 'error',
      category: 'Title',
      title: 'Missing Title Tag',
      description: 'The page is missing a title tag or it is empty.',
      fix: 'Add a descriptive title tag between 50-60 characters.',
      impact: 'high'
    })
    score -= 20
  } else {
    const titleText = title.textContent.trim()
    if (titleText.length < 30) {
      issues.push({
        type: 'warning',
        category: 'Title',
        title: 'Title Too Short',
        description: `Title is only ${titleText.length} characters. Recommended length is 50-60 characters.`,
        fix: 'Expand the title to be more descriptive and include relevant keywords.',
        impact: 'medium'
      })
      score -= 5
    } else if (titleText.length > 60) {
      issues.push({
        type: 'warning',
        category: 'Title',
        title: 'Title Too Long',
        description: `Title is ${titleText.length} characters. Recommended length is 50-60 characters.`,
        fix: 'Shorten the title to avoid truncation in search results.',
        impact: 'medium'
      })
      score -= 3
    } else {
      // Positive: Good title length
      highlights.push({
        type: 'good-practice',
        category: 'Title',
        title: 'Optimal Title Length',
        description: `Title is ${titleText.length} characters, which is within the recommended 50-60 character range.`,
        impact: 'high'
      })
    }
  }

  // Check meta description
  const metaDescription = doc.querySelector('meta[name="description"]')
  if (!metaDescription || !metaDescription.getAttribute('content')?.trim()) {
    issues.push({
      type: 'error',
      category: 'Meta Description',
      title: 'Missing Meta Description',
      description: 'The page is missing a meta description tag.',
      fix: 'Add a compelling meta description between 150-160 characters.',
      impact: 'high'
    })
    score -= 15
  } else {
    const descContent = metaDescription.getAttribute('content')?.trim() || ''
    if (descContent.length < 120) {
      issues.push({
        type: 'warning',
        category: 'Meta Description',
        title: 'Meta Description Too Short',
        description: `Meta description is only ${descContent.length} characters. Recommended length is 150-160 characters.`,
        fix: 'Expand the meta description to be more descriptive.',
        impact: 'medium'
      })
      score -= 5
    } else if (descContent.length > 160) {
      issues.push({
        type: 'warning',
        category: 'Meta Description',
        title: 'Meta Description Too Long',
        description: `Meta description is ${descContent.length} characters. Recommended length is 150-160 characters.`,
        fix: 'Shorten the meta description to avoid truncation.',
        impact: 'medium'
      })
      score -= 3
    } else {
      // Positive: Good meta description length
      highlights.push({
        type: 'good-practice',
        category: 'Meta Description',
        title: 'Optimal Meta Description Length',
        description: `Meta description is ${descContent.length} characters, which is within the recommended 150-160 character range.`,
        impact: 'high'
      })
    }
  }

  // Check heading structure
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const h1Tags = doc.querySelectorAll('h1')
  
  if (h1Tags.length === 0) {
    issues.push({
      type: 'error',
      category: 'Headings',
      title: 'Missing H1 Tag',
      description: 'The page is missing an H1 tag.',
      fix: 'Add a single, descriptive H1 tag that summarizes the main content.',
      impact: 'high'
    })
    score -= 15
  } else if (h1Tags.length > 1) {
    issues.push({
      type: 'warning',
      category: 'Headings',
      title: 'Multiple H1 Tags',
      description: `Found ${h1Tags.length} H1 tags. Only one H1 should be used per page.`,
      fix: 'Use only one H1 tag per page and structure other headings with H2-H6.',
      impact: 'medium'
    })
    score -= 8
  } else {
    // Positive: Single H1 tag
    highlights.push({
      type: 'good-practice',
      category: 'Headings',
      title: 'Proper H1 Structure',
      description: 'Page has exactly one H1 tag, which is optimal for SEO.',
      impact: 'high'
    })
  }

  // Check for proper heading hierarchy
  let previousLevel = 0
  let hasHierarchyIssue = false
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > previousLevel + 1) {
      hasHierarchyIssue = true
    }
    previousLevel = level
  })

  if (hasHierarchyIssue) {
    issues.push({
      type: 'warning',
      category: 'Headings',
      title: 'Improper Heading Hierarchy',
      description: 'Headings are not properly structured (e.g., H1 → H3 without H2).',
      fix: 'Ensure headings follow a logical hierarchy: H1 → H2 → H3, etc.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check images for alt text
  const images = doc.querySelectorAll('img')
  const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'))
  
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      type: 'error',
      category: 'Images',
      title: 'Images Missing Alt Text',
      description: `${imagesWithoutAlt.length} image(s) are missing alt text.`,
      fix: 'Add descriptive alt text to all images for accessibility and SEO.',
      impact: 'high'
    })
    score -= Math.min(imagesWithoutAlt.length * 3, 15)
  } else if (images.length > 0) {
    // Positive: All images have alt text
    highlights.push({
      type: 'achievement',
      category: 'Images',
      title: 'All Images Have Alt Text',
      description: `All ${images.length} image(s) have descriptive alt text for accessibility and SEO.`,
      impact: 'high'
    })
  }

  // Check for internal links
  const links = doc.querySelectorAll('a[href]')
  const internalLinks = Array.from(links).filter(link => {
    const href = link.getAttribute('href')
    return href && (href.startsWith('/') || href.includes(new URL(url).hostname))
  })

  if (internalLinks.length === 0) {
    issues.push({
      type: 'warning',
      category: 'Links',
      title: 'No Internal Links',
      description: 'The page has no internal links to other pages on the site.',
      fix: 'Add relevant internal links to improve site structure and user navigation.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for external links
  const externalLinks = Array.from(links).filter(link => {
    const href = link.getAttribute('href')
    return href && href.startsWith('http') && !href.includes(new URL(url).hostname)
  })

  if (externalLinks.length > 0) {
    const linksWithoutRel = externalLinks.filter(link => !link.getAttribute('rel')?.includes('nofollow'))
    if (linksWithoutRel.length > 0) {
      issues.push({
        type: 'info',
        category: 'Links',
        title: 'External Links Without nofollow',
        description: `${linksWithoutRel.length} external link(s) don't have rel="nofollow".`,
        fix: 'Consider adding rel="nofollow" to external links to control link equity.',
        impact: 'low'
      })
      score -= 2
    }
  }

  // Check for meta viewport
  const viewport = doc.querySelector('meta[name="viewport"]')
  if (!viewport) {
    issues.push({
      type: 'error',
      category: 'Mobile',
      title: 'Missing Viewport Meta Tag',
      description: 'The page is missing a viewport meta tag for mobile responsiveness.',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to the head.',
      impact: 'high'
    })
    score -= 15
  } else {
    // Positive: Viewport meta tag present
    highlights.push({
      type: 'good-practice',
      category: 'Mobile',
      title: 'Mobile-Responsive Design',
      description: 'Page has viewport meta tag for proper mobile display.',
      impact: 'high'
    })
  }

  // Check for canonical URL
  const canonical = doc.querySelector('link[rel="canonical"]')
  if (!canonical) {
    issues.push({
      type: 'warning',
      category: 'URL Structure',
      title: 'Missing Canonical URL',
      description: 'The page is missing a canonical URL to prevent duplicate content issues.',
      fix: 'Add a canonical link tag pointing to the preferred version of the page.',
      impact: 'medium'
    })
    score -= 8
  }

  // Check for Open Graph tags
  const ogTitle = doc.querySelector('meta[property="og:title"]')
  const ogDescription = doc.querySelector('meta[property="og:description"]')
  const ogImage = doc.querySelector('meta[property="og:image"]')

  if (!ogTitle || !ogDescription || !ogImage) {
    issues.push({
      type: 'warning',
      category: 'Social Media',
      title: 'Incomplete Open Graph Tags',
      description: 'Missing some Open Graph meta tags for social media sharing.',
      fix: 'Add og:title, og:description, and og:image meta tags.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for structured data
  const structuredData = doc.querySelectorAll('script[type="application/ld+json"]')
  if (structuredData.length === 0) {
    issues.push({
      type: 'info',
      category: 'Structured Data',
      title: 'No Structured Data',
      description: 'The page has no structured data markup.',
      fix: 'Consider adding JSON-LD structured data to help search engines understand your content.',
      impact: 'low'
    })
    score -= 3
  } else {
    // Positive: Has structured data
    highlights.push({
      type: 'optimization',
      category: 'Structured Data',
      title: 'Rich Snippets Ready',
      description: `Page has ${structuredData.length} structured data markup(s) for enhanced search results.`,
      impact: 'high'
    })
  }

  // Check content length
  const bodyText = doc.body?.textContent || ''
  const wordCount = bodyText.trim().split(/\s+/).length

  if (wordCount < 300) {
    issues.push({
      type: 'warning',
      category: 'Content',
      title: 'Content Too Short',
      description: `Page content is only ${wordCount} words. Recommended minimum is 300 words.`,
      fix: 'Add more valuable, relevant content to improve SEO and user experience.',
      impact: 'medium'
    })
    score -= 10
  } else if (wordCount >= 500) {
    // Positive: Good content length
    highlights.push({
      type: 'good-practice',
      category: 'Content',
      title: 'Comprehensive Content',
      description: `Page has ${wordCount} words of content, which provides good value to users and search engines.`,
      impact: 'high'
    })
  }

  // === ADVANCED SEO CHECKS ===

  // Check robots meta tag
  const robotsMeta = doc.querySelector('meta[name="robots"]')
  if (!robotsMeta) {
    issues.push({
      type: 'info',
      category: 'Technical SEO',
      title: 'No Robots Meta Tag',
      description: 'No robots meta tag found. Search engines will use default crawling behavior.',
      fix: 'Add a robots meta tag to control how search engines crawl and index your page.',
      impact: 'low'
    })
    score -= 2
  } else {
    const robotsContent = robotsMeta.getAttribute('content')?.toLowerCase() || ''
    if (robotsContent.includes('noindex')) {
      issues.push({
        type: 'warning',
        category: 'Technical SEO',
        title: 'Page Set to No-Index',
        description: 'This page is set to noindex, which prevents it from appearing in search results.',
        fix: 'Remove noindex from robots meta tag if you want this page to be indexed.',
        impact: 'high'
      })
      score -= 20
    }
  }

  // Check for meta keywords (deprecated but still checked)
  const metaKeywords = doc.querySelector('meta[name="keywords"]')
  if (metaKeywords) {
    issues.push({
      type: 'info',
      category: 'Meta Tags',
      title: 'Meta Keywords Tag Present',
      description: 'Meta keywords tag is present but is no longer used by major search engines.',
      fix: 'Remove the meta keywords tag as it has no SEO value and may be considered spam.',
      impact: 'low'
    })
    score -= 1
  }

  // Check for meta author
  const metaAuthor = doc.querySelector('meta[name="author"]')
  if (!metaAuthor) {
    issues.push({
      type: 'info',
      category: 'Meta Tags',
      title: 'Missing Meta Author',
      description: 'No meta author tag found.',
      fix: 'Add a meta author tag to establish content authorship.',
      impact: 'low'
    })
    score -= 1
  }

  // Check for charset declaration
  const charset = doc.querySelector('meta[charset]')
  if (!charset) {
    issues.push({
      type: 'error',
      category: 'Technical SEO',
      title: 'Missing Charset Declaration',
      description: 'No charset meta tag found. This can cause encoding issues.',
      fix: 'Add <meta charset="UTF-8"> as the first meta tag in the head section.',
      impact: 'high'
    })
    score -= 10
  }

  // Check for favicon
  const favicon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]')
  if (!favicon) {
    issues.push({
      type: 'warning',
      category: 'Technical SEO',
      title: 'Missing Favicon',
      description: 'No favicon found. This affects branding in browser tabs and bookmarks.',
      fix: 'Add a favicon link tag in the head section.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for HTTPS (if URL is provided)
  if (urlObj.protocol === 'http:') {
    issues.push({
      type: 'error',
      category: 'Security',
      title: 'Not Using HTTPS',
      description: 'The page is not using HTTPS, which is required for good SEO.',
      fix: 'Implement SSL certificate and redirect HTTP to HTTPS.',
      impact: 'high'
    })
    score -= 15
  } else {
    // Positive: Using HTTPS
    highlights.push({
      type: 'achievement',
      category: 'Security',
      title: 'Secure HTTPS Connection',
      description: 'Page is using HTTPS, which is essential for SEO and user trust.',
      impact: 'high'
    })
  }

  // Check URL structure
  const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0)
  if (pathSegments.length > 4) {
    issues.push({
      type: 'warning',
      category: 'URL Structure',
      title: 'Deep URL Structure',
      description: `URL has ${pathSegments.length} levels deep. Shallow URLs are better for SEO.`,
      fix: 'Consider restructuring URLs to be more shallow and user-friendly.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for URL parameters
  if (urlObj.search && urlObj.searchParams.size > 3) {
    issues.push({
      type: 'warning',
      category: 'URL Structure',
      title: 'Too Many URL Parameters',
      description: `URL has ${urlObj.searchParams.size} parameters. Too many parameters can confuse search engines.`,
      fix: 'Consider using clean URLs with fewer parameters.',
      impact: 'medium'
    })
    score -= 3
  }

  // Check for duplicate title and meta description
  const titleText = title?.textContent?.trim() || ''
  const metaDescContent = metaDescription?.getAttribute('content')?.trim() || ''
  
  if (titleText && metaDescContent && titleText === metaDescContent) {
    issues.push({
      type: 'warning',
      category: 'Content',
      title: 'Duplicate Title and Meta Description',
      description: 'Title and meta description are identical, which reduces SEO effectiveness.',
      fix: 'Make title and meta description unique and complementary.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for Twitter Card tags
  const twitterCard = doc.querySelector('meta[name="twitter:card"]')
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')
  const twitterDescription = doc.querySelector('meta[name="twitter:description"]')
  const twitterImage = doc.querySelector('meta[name="twitter:image"]')

  if (!twitterCard || !twitterTitle || !twitterDescription || !twitterImage) {
    issues.push({
      type: 'info',
      category: 'Social Media',
      title: 'Incomplete Twitter Card Tags',
      description: 'Missing some Twitter Card meta tags for better social media sharing.',
      fix: 'Add complete Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image).',
      impact: 'low'
    })
    score -= 2
  }

  // Check for language declaration
  const htmlLang = doc.documentElement.getAttribute('lang')
  if (!htmlLang) {
    issues.push({
      type: 'warning',
      category: 'International SEO',
      title: 'Missing Language Declaration',
      description: 'No lang attribute found on the html element.',
      fix: 'Add lang attribute to the html tag (e.g., <html lang="en">).',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for hreflang tags (international SEO)
  const hreflangTags = doc.querySelectorAll('link[rel="alternate"][hreflang]')
  if (hreflangTags.length > 0) {
    const hreflangValues = Array.from(hreflangTags).map(tag => tag.getAttribute('hreflang'))
    const hasXDefault = hreflangValues.includes('x-default')
    
    if (!hasXDefault) {
      issues.push({
        type: 'warning',
        category: 'International SEO',
        title: 'Missing x-default hreflang',
        description: 'Hreflang tags found but missing x-default for international SEO.',
        fix: 'Add hreflang="x-default" link tag for users in unspecified regions.',
        impact: 'medium'
      })
      score -= 3
    }
  }

  // Check for breadcrumb structured data
  const breadcrumbSchema = doc.querySelector('script[type="application/ld+json"]')
  let hasBreadcrumbSchema = false
  if (breadcrumbSchema) {
    try {
      const schemaData = JSON.parse(breadcrumbSchema.textContent || '')
      if (schemaData['@type'] === 'BreadcrumbList' || 
          (Array.isArray(schemaData) && schemaData.some((item: any) => item['@type'] === 'BreadcrumbList'))) {
        hasBreadcrumbSchema = true
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Check for breadcrumb navigation
  const breadcrumbNav = doc.querySelector('nav[aria-label*="breadcrumb"], nav[aria-label*="Breadcrumb"]')
  if (!breadcrumbNav && !hasBreadcrumbSchema) {
    issues.push({
      type: 'info',
      category: 'Navigation',
      title: 'No Breadcrumb Navigation',
      description: 'No breadcrumb navigation found. Breadcrumbs help users and search engines understand site structure.',
      fix: 'Add breadcrumb navigation with proper markup or structured data.',
      impact: 'low'
    })
    score -= 2
  }

  // Check for skip links (accessibility)
  const skipLinks = doc.querySelectorAll('a[href^="#"]')
  const hasSkipLink = Array.from(skipLinks).some(link => 
    link.textContent?.toLowerCase().includes('skip') || 
    link.getAttribute('href') === '#main' ||
    link.getAttribute('href') === '#content'
  )
  
  if (!hasSkipLink) {
    issues.push({
      type: 'info',
      category: 'Accessibility',
      title: 'No Skip Links',
      description: 'No skip links found for keyboard navigation accessibility.',
      fix: 'Add skip links to help keyboard users navigate your site.',
      impact: 'low'
    })
    score -= 1
  }

  // Check for proper heading structure with content
  const h1Content = doc.querySelector('h1')?.textContent?.trim()
  if (h1Content && h1Content.length < 10) {
    issues.push({
      type: 'warning',
      category: 'Headings',
      title: 'H1 Content Too Short',
      description: 'H1 tag content is very short and may not be descriptive enough.',
      fix: 'Make H1 content more descriptive and keyword-rich.',
      impact: 'medium'
    })
    score -= 3
  }

  // Check for keyword density (basic analysis)
  // const titleKeywords = titleText.toLowerCase().split(/\s+/)
  const bodyKeywords = bodyText.toLowerCase().split(/\s+/)
  const totalWords = bodyKeywords.length
  
  if (totalWords > 0) {
    const keywordDensity: { [key: string]: number } = {}
    bodyKeywords.forEach(word => {
      if (word.length > 3) { // Only count words longer than 3 characters
        keywordDensity[word] = (keywordDensity[word] || 0) + 1
      }
    })
    
    // Find over-optimized keywords
    Object.entries(keywordDensity).forEach(([keyword, count]) => {
      const density = (count / totalWords) * 100
      if (density > 3) { // More than 3% density
        issues.push({
          type: 'warning',
          category: 'Content',
          title: 'Potential Keyword Stuffing',
          description: `Keyword "${keyword}" appears ${count} times (${density.toFixed(1)}% density).`,
          fix: 'Reduce keyword density to avoid over-optimization penalties.',
          impact: 'medium'
        })
        score -= 5
      }
    })
  }

  // Check for internal link anchor text
  const internalLinkAnchors = internalLinks.map(link => link.textContent?.trim()).filter(text => text && text.length > 0)
  const genericAnchors = internalLinkAnchors.filter(anchor => 
    ['click here', 'read more', 'learn more', 'here', 'this', 'link'].includes(anchor.toLowerCase())
  )
  
  if (genericAnchors.length > internalLinkAnchors.length * 0.3) {
    issues.push({
      type: 'warning',
      category: 'Links',
      title: 'Generic Anchor Text',
      description: `${genericAnchors.length} internal links use generic anchor text.`,
      fix: 'Use descriptive anchor text that indicates the destination page content.',
      impact: 'medium'
    })
    score -= 5
  }

  // Check for external link attributes
  const externalLinksWithoutTarget = externalLinks.filter(link => !link.getAttribute('target'))
  if (externalLinksWithoutTarget.length > 0) {
    issues.push({
      type: 'info',
      category: 'Links',
      title: 'External Links Without target="_blank"',
      description: `${externalLinksWithoutTarget.length} external link(s) don't open in new tabs.`,
      fix: 'Add target="_blank" to external links to keep users on your site.',
      impact: 'low'
    })
    score -= 1
  }

  // Check for duplicate content indicators
  const duplicateContentIndicators = [
    'Lorem ipsum',
    'placeholder text',
    'sample text',
    'dummy content',
    'coming soon'
  ]
  
  const hasDuplicateContent = duplicateContentIndicators.some(indicator => 
    bodyText.toLowerCase().includes(indicator.toLowerCase())
  )
  
  if (hasDuplicateContent) {
    issues.push({
      type: 'error',
      category: 'Content',
      title: 'Duplicate/Placeholder Content',
      description: 'Page contains placeholder or duplicate content that should be replaced.',
      fix: 'Replace placeholder content with original, valuable content.',
      impact: 'high'
    })
    score -= 15
  }

  // Generate recommendations
  const recommendations: string[] = []
  
  if (score < 70) {
    recommendations.push('Focus on fixing high-impact issues first, especially missing title tags and meta descriptions.')
  }
  
  if (imagesWithoutAlt.length > 0) {
    recommendations.push('Add alt text to all images to improve accessibility and SEO.')
  }
  
  if (wordCount < 500) {
    recommendations.push('Expand your content with valuable, relevant information to improve search rankings.')
  }
  
  if (internalLinks.length < 3) {
    recommendations.push('Add more internal links to improve site structure and user navigation.')
  }

  // Advanced recommendations based on analysis
  if (!doc.querySelector('meta[name="robots"]')) {
    recommendations.push('Consider adding robots meta tags to control search engine crawling behavior.')
  }

  if (!doc.querySelector('link[rel="canonical"]')) {
    recommendations.push('Add canonical URLs to prevent duplicate content issues and consolidate link equity.')
  }

  if (!doc.querySelector('meta[property="og:title"]') || !doc.querySelector('meta[property="og:description"]')) {
    recommendations.push('Implement complete Open Graph tags for better social media sharing and click-through rates.')
  }

  if (!doc.querySelector('script[type="application/ld+json"]')) {
    recommendations.push('Add structured data (JSON-LD) to help search engines understand your content better.')
  }

  if (urlObj.protocol === 'http:') {
    recommendations.push('Implement HTTPS immediately as it\'s a ranking factor and required for modern web standards.')
  }

  if (pathSegments.length > 3) {
    recommendations.push('Consider flattening your URL structure for better SEO and user experience.')
  }

  if (hreflangTags.length > 0 && !Array.from(hreflangTags).some((tag: Element) => tag.getAttribute('hreflang') === 'x-default')) {
    recommendations.push('Add x-default hreflang tag for international SEO to handle users from unspecified regions.')
  }

  if (genericAnchors.length > 0) {
    recommendations.push('Replace generic anchor text with descriptive, keyword-rich text for better SEO.')
  }

  if (duplicateContentIndicators.some(indicator => bodyText.toLowerCase().includes(indicator.toLowerCase()))) {
    recommendations.push('Replace all placeholder content with original, valuable content to avoid duplicate content penalties.')
  }

  if (score >= 90) {
    recommendations.push('Excellent SEO foundation! Consider advanced optimizations like Core Web Vitals and user experience improvements.')
  } else if (score >= 80) {
    recommendations.push('Good SEO score! Focus on the remaining issues to reach excellent status.')
  } else if (score >= 60) {
    recommendations.push('Moderate SEO score. Prioritize high-impact fixes to improve your search rankings.')
  } else {
    recommendations.push('SEO needs significant improvement. Start with basic on-page optimization and technical SEO fixes.')
  }

  // Calculate summary
  const summary = {
    totalIssues: issues.length,
    errors: issues.filter(issue => issue.type === 'error').length,
    warnings: issues.filter(issue => issue.type === 'warning').length,
    info: issues.filter(issue => issue.type === 'info').length,
    totalHighlights: highlights.length
  }

  return {
    score: Math.max(0, score),
    issues,
    highlights,
    summary,
    recommendations
  }
}
