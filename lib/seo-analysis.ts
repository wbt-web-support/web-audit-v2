export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  fix: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOAnalysisResult {
  score: number
  issues: SEOIssue[]
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    info: number
  }
  recommendations: string[]
}

export function analyzeSEO(htmlContent: string, url: string): SEOAnalysisResult {
  const issues: SEOIssue[] = []
  let score = 100

  // Parse HTML content
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')

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

  // Calculate summary
  const summary = {
    totalIssues: issues.length,
    errors: issues.filter(issue => issue.type === 'error').length,
    warnings: issues.filter(issue => issue.type === 'warning').length,
    info: issues.filter(issue => issue.type === 'info').length
  }

  return {
    score: Math.max(0, score),
    issues,
    summary,
    recommendations
  }
}
