'use client'

import { useEffect, useRef } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { filterHtmlContent } from '@/lib/html-content-filter'

interface ScrapingServiceProps {
  projectId: string | null
  scrapingData: any
  onScrapingComplete: (success: boolean) => void
  forceProcess?: boolean
}

export default function ScrapingService({ projectId, scrapingData, onScrapingComplete, forceProcess = false }: ScrapingServiceProps) {
  const { createScrapedPages, updateAuditProject, processMetaTagsData, getAuditProject } = useSupabase()
  const isProcessing = useRef(false)
  const processedDataRef = useRef<string | null>(null)

  // Function to process CMS data and remove duplicates
  const processCmsData = (cmsData: any) => {
    if (!cmsData) {
      return {
        cms_type: null,
        cms_version: null,
        cms_plugins: null,
        cms_themes: null,
        cms_components: null,
        cms_confidence: 0,
        cms_detection_method: null,
        cms_metadata: null
      }
    }

    // Process plugins - remove duplicates and add metadata
    const uniquePlugins = cmsData.plugins ? 
      cmsData.plugins.reduce((acc: any[], plugin: any) => {
        const existing = acc.find(p => p.name === plugin.name)
        if (!existing) {
          acc.push({
            name: plugin.name || 'Unknown Plugin',
            version: plugin.version || null,
            active: plugin.active !== false,
            path: plugin.path || null,
            description: plugin.description || null,
            author: plugin.author || null,
            confidence: plugin.confidence || 0.8,
            detection_method: plugin.detection_method || 'unknown'
          })
        } else {
          // Update existing plugin with higher confidence or more info
          if ((plugin.confidence || 0.8) > existing.confidence) {
            Object.assign(existing, {
              version: plugin.version || existing.version,
              active: plugin.active !== false ? plugin.active : existing.active,
              path: plugin.path || existing.path,
              description: plugin.description || existing.description,
              author: plugin.author || existing.author,
              confidence: plugin.confidence || existing.confidence,
              detection_method: plugin.detection_method || existing.detection_method
            })
          }
        }
        return acc
      }, []) : null

    // Process themes - remove duplicates and add metadata
    const uniqueThemes = cmsData.themes ? 
      cmsData.themes.reduce((acc: any[], theme: any) => {
        const existing = acc.find(t => t.name === theme.name)
        if (!existing) {
          acc.push({
            name: theme.name || 'Unknown Theme',
            version: theme.version || null,
            active: theme.active !== false,
            path: theme.path || null,
            description: theme.description || null,
            author: theme.author || null,
            confidence: theme.confidence || 0.8,
            detection_method: theme.detection_method || 'unknown'
          })
        } else {
          // Update existing theme with higher confidence or more info
          if ((theme.confidence || 0.8) > existing.confidence) {
            Object.assign(existing, {
              version: theme.version || existing.version,
              active: theme.active !== false ? theme.active : existing.active,
              path: theme.path || existing.path,
              description: theme.description || existing.description,
              author: theme.author || existing.author,
              confidence: theme.confidence || existing.confidence,
              detection_method: theme.detection_method || existing.detection_method
            })
          }
        }
        return acc
      }, []) : null

    // Process components - remove duplicates and add metadata
    const uniqueComponents = cmsData.components ? 
      cmsData.components.reduce((acc: any[], component: any) => {
        const existing = acc.find(c => c.name === component.name && c.type === component.type)
        if (!existing) {
          acc.push({
            name: component.name || 'Unknown Component',
            type: component.type || 'unknown',
            version: component.version || null,
            active: component.active !== false,
            path: component.path || null,
            description: component.description || null,
            confidence: component.confidence || 0.8,
            detection_method: component.detection_method || 'unknown'
          })
        } else {
          // Update existing component with higher confidence or more info
          if ((component.confidence || 0.8) > existing.confidence) {
            Object.assign(existing, {
              version: component.version || existing.version,
              active: component.active !== false ? component.active : existing.active,
              path: component.path || existing.path,
              description: component.description || existing.description,
              confidence: component.confidence || existing.confidence,
              detection_method: component.detection_method || existing.detection_method
            })
          }
        }
        return acc
      }, []) : null

    return {
      cms_type: cmsData.type || null,
      cms_version: cmsData.version || null,
      cms_plugins: uniquePlugins,
      cms_themes: uniqueThemes,
      cms_components: uniqueComponents,
      cms_confidence: cmsData.confidence || 0,
      cms_detection_method: cmsData.detection_method || null,
      cms_metadata: {
        detection_timestamp: new Date().toISOString(),
        total_plugins: uniquePlugins?.length || 0,
        total_themes: uniqueThemes?.length || 0,
        total_components: uniqueComponents?.length || 0,
        active_plugins: uniquePlugins?.filter((p: any) => p.active).length || 0,
        active_themes: uniqueThemes?.filter((t: any) => t.active).length || 0,
        active_components: uniqueComponents?.filter((c: any) => c.active).length || 0,
        ...cmsData.metadata
      }
    }
  }

  // Function to process technologies data and remove duplicates
  const processTechnologiesData = (technologiesData: any, summaryTechnologies: string[] = []) => {
    // Combine both detailed technologies and summary technologies
    const allTechnologies: any[] = []
    
    // Add detailed technologies if available
    if (technologiesData && Array.isArray(technologiesData)) {
      technologiesData.forEach(tech => {
        // Check if it's a string (simple technology name) or an object (detailed technology)
        if (typeof tech === 'string') {
          allTechnologies.push({
            name: tech,
            version: null,
            category: 'unknown',
            confidence: 0.9,
            detection_method: 'extracted_data',
            description: null,
            website: null,
            icon: null
          })
        } else if (typeof tech === 'object' && tech !== null) {
          // It's a detailed technology object
          allTechnologies.push(tech)
        }
      })
    }
    
    // Add summary technologies as simple objects
    if (summaryTechnologies && Array.isArray(summaryTechnologies)) {
      summaryTechnologies.forEach(techName => {
        allTechnologies.push({
          name: techName,
          version: null,
          category: 'unknown',
          confidence: 0.9, // Higher confidence for summary technologies
          detection_method: 'summary',
          description: null,
          website: null,
          icon: null
        })
      })
    }

    if (allTechnologies.length === 0) {
      return {
        technologies: null,
        technologies_confidence: 0,
        technologies_detection_method: null,
        technologies_metadata: null
      }
    }

    // Process technologies - remove duplicates and add metadata
    const uniqueTechnologies = allTechnologies.reduce((acc: any[], tech: any) => {
      const existing = acc.find(t => t.name === tech.name && t.category === (tech.category || 'unknown'))
      
      if (!existing) {
        acc.push({
          name: tech.name || 'Unknown Technology',
          version: tech.version || null,
          category: tech.category || 'unknown',
          confidence: tech.confidence || 0.8,
          detection_method: tech.detection_method || 'unknown',
          description: tech.description || null,
          website: tech.website || null,
          icon: tech.icon || null,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
      } else {
        // Update existing technology with higher confidence or more info
        if ((tech.confidence || 0.8) > existing.confidence) {
          Object.assign(existing, {
            version: tech.version || existing.version,
            confidence: tech.confidence || existing.confidence,
            detection_method: tech.detection_method || existing.detection_method,
            description: tech.description || existing.description,
            website: tech.website || existing.website,
            icon: tech.icon || existing.icon,
            last_seen: new Date().toISOString()
          })
        } else {
          // Update last_seen even if confidence is lower
          existing.last_seen = new Date().toISOString()
        }
      }
      return acc
    }, [])

    // Calculate overall confidence
    const overallConfidence = uniqueTechnologies.length > 0 
      ? uniqueTechnologies.reduce((sum, tech) => sum + tech.confidence, 0) / uniqueTechnologies.length
      : 0

    // Group technologies by category
    const technologiesByCategory = uniqueTechnologies.reduce((acc: any, tech: any) => {
      const category = tech.category || 'unknown'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(tech)
      return acc
    }, {})

    return {
      technologies: uniqueTechnologies,
      technologies_confidence: overallConfidence,
      technologies_detection_method: 'mixed', // Could be more specific based on detection methods
      technologies_metadata: {
        detection_timestamp: new Date().toISOString(),
        total_technologies: uniqueTechnologies.length,
        categories: Object.keys(technologiesByCategory),
        technologies_by_category: technologiesByCategory,
        high_confidence_technologies: uniqueTechnologies.filter((t: any) => t.confidence >= 0.8).length,
        medium_confidence_technologies: uniqueTechnologies.filter((t: any) => t.confidence >= 0.5 && t.confidence < 0.8).length,
        low_confidence_technologies: uniqueTechnologies.filter((t: any) => t.confidence < 0.5).length
      }
    }
  }


  // Function to process scraping data and save to database
  const processScrapingData = async (scrapingData: any, projectId: string) => {
    try {
      
      
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found in scraping response')
        onScrapingComplete(false)
        return
      }

      // Function to extract all social media meta tags from HTML content
      const extractSocialMetaTags = (htmlContent: string) => {
        if (!htmlContent) return { socialMetaTags: [], count: 0 }
        
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, 'text/html')
        
        // Extract all social media meta tags
        const socialMetaTags = doc.querySelectorAll(`
          meta[property^="og:"],
          meta[name^="twitter:"],
          meta[name^="linkedin:"],
          meta[name^="pinterest:"],
          meta[name^="whatsapp:"],
          meta[name^="telegram:"],
          meta[name^="discord:"],
          meta[name^="slack:"]
        `)
        
        const extractedTags: any[] = []
        socialMetaTags.forEach((tag) => {
          const element = tag as HTMLMetaElement
          extractedTags.push({
            name: element.name || '',
            property: element.getAttribute('property') || '',
            content: element.content || '',
            httpEquiv: element.getAttribute('http-equiv') || undefined
          })
        })
        
        return { socialMetaTags: extractedTags, count: extractedTags.length }
      }

      // Prepare scraped pages data (including HTML content for individual pages)
      const scrapedPagesData = scrapingData.pages.map((page: any) => {
        const { socialMetaTags, count: socialMetaTagsCount } = extractSocialMetaTags(page.html)
        
        // Filter HTML content to get pure text content
        console.log('🔍 Processing page HTML for filtering:', {
          url: page.url,
          hasHtml: !!page.html,
          htmlLength: page.html?.length || 0,
          htmlPreview: page.html?.substring(0, 200) + '...'
        })
        
        const filteredContent = filterHtmlContent(page.html)
        
        console.log('✅ HTML filtering completed:', {
          url: page.url,
          originalLength: page.html?.length || 0,
          filteredLength: filteredContent.filteredLength,
          wordCount: filteredContent.wordCount,
          characterCount: filteredContent.characterCount,
          contentPreview: filteredContent.pureContent.substring(0, 200) + '...'
        })
        return {
          audit_project_id: projectId,
          url: page.url,
          status_code: page.statusCode,
          title: page.title,
          description: page.metaTags?.find((tag: any) => tag.name === 'description')?.content || null,
          html_content: page.html, // Keep original HTML content
          html_content_length: page.htmlContentLength, // Keep original HTML length
          filtered_content: filteredContent.pureContent, // Store filtered pure text content in new column
          filtered_content_length: filteredContent.filteredLength, // Store filtered content length
          links_count: page.links?.length || 0,
          images_count: page.images?.length || 0,
          links: page.links || null, // Store actual links data
          images: page.images || null, // Store actual images data
          meta_tags_count: page.metaTags?.length || 0,
          technologies_count: page.technologies?.length || 0,
          technologies: page.technologies || null,
          cms_type: scrapingData.extractedData?.cms?.type || null,
          cms_version: scrapingData.extractedData?.cms?.version || null,
          cms_plugins: scrapingData.extractedData?.cms?.plugins || null,
          social_meta_tags: socialMetaTags, // Store full social meta tags data
          social_meta_tags_count: socialMetaTagsCount, // Store count as well
          is_external: false, // Main page is not external
          response_time: scrapingData.responseTime
        }
      })

      

      // Save scraped pages to database
      const { error: pagesError } = await createScrapedPages(scrapedPagesData)
      
      if (pagesError) {
        console.error('❌ Error saving scraped pages:', pagesError)
        onScrapingComplete(false)
        return
      } else {
        
      }

      // Process meta tags data from homepage
      
      const { error: metaTagsError } = await processMetaTagsData(projectId)
      if (metaTagsError) {
        console.warn('⚠️ Meta tags processing failed:', metaTagsError)
      } else {
        
      }

      // Process CMS data to avoid repetition and extract unique information
      const cmsData = processCmsData(scrapingData.extractedData?.cms)
      
      // Process technologies data to avoid repetition and extract unique information
      const technologiesData = processTechnologiesData(
        scrapingData.extractedData?.technologies,
        scrapingData.summary?.technologies
      )
      // Extract HTML content from all pages
      console.log('🔍 Starting to process pages for HTML extraction...')
      console.log('📊 Total pages to process:', scrapingData.pages?.length || 0)
      
      const allPagesHtml = scrapingData.pages.map((page: any, index: number) => {
        console.log(`📄 Processing page ${index + 1}/${scrapingData.pages.length}:`, {
          url: page.url,
          hasHtml: !!page.html,
          htmlLength: page.html?.length || 0,
          title: page.title,
          statusCode: page.statusCode
        })
        
        // Create simplified page data structure
        const pageData = {
          pageName: page.title || `Page ${index + 1}`,
          pageUrl: page.url,
          pageHtml: page.html || ''
        }
        
        console.log(`✅ Page ${index + 1} processed successfully:`, {
          pageName: pageData.pageName,
          pageUrl: pageData.pageUrl,
          htmlLength: pageData.pageHtml?.length || 0
        })
        
        return pageData
      })
      
      console.log('🎯 All pages HTML extraction completed!')
      console.log('📈 Final allPagesHtml array:', {
        totalPages: allPagesHtml.length,
        pagesWithHtml: allPagesHtml.filter((p: any) => p.pageHtml).length,
        totalHtmlLength: allPagesHtml.reduce((sum: number, p: any) => sum + (p.pageHtml?.length || 0), 0),
        sampleUrls: allPagesHtml.slice(0, 3).map((p: any) => p.pageUrl)
      })
      
      // Log first page HTML sample for debugging
      if (allPagesHtml.length > 0 && allPagesHtml[0].pageHtml) {
        console.log('🔍 First page HTML sample (first 500 chars):', allPagesHtml[0].pageHtml.substring(0, 500))
      }
      
    
      // Update audit project with summary data
      console.log('💾 Preparing to save allPagesHtml to database...')
      console.log('📊 allPagesHtml data summary:', {
        totalPages: allPagesHtml.length,
        totalHtmlSize: allPagesHtml.reduce((sum: number, p: any) => sum + (p.pageHtml?.length || 0), 0),
        urls: allPagesHtml.map((p: any) => p.pageUrl)
      })
      
      // Aggregate images and links from all pages
      console.log('🖼️ Aggregating images and links data from all pages...')
      const allImages: any[] = []
      const allLinks: any[] = []
      
      scrapingData.pages.forEach((page: any, index: number) => {
        console.log(`📄 Processing page ${index + 1} for images and links:`, {
          url: page.url,
          imagesCount: page.images?.length || 0,
          linksCount: page.links?.length || 0
        })
        
        // Add images with page context
        if (page.images && Array.isArray(page.images)) {
          page.images.forEach((image: any) => {
            allImages.push({
              ...image,
              page_url: page.url,
              page_title: page.title,
              page_index: index
            })
          })
        }
        
        // Add links with page context
        if (page.links && Array.isArray(page.links)) {
          page.links.forEach((link: any) => {
            allLinks.push({
              ...link,
              page_url: page.url,
              page_title: page.title,
              page_index: index
            })
          })
        }
      })
      
      console.log('📊 Aggregated data summary:', {
        totalImages: allImages.length,
        totalLinks: allLinks.length,
        uniqueImageSources: [...new Set(allImages.map(img => img.src))].length,
        uniqueLinkHrefs: [...new Set(allLinks.map(link => link.href))].length
      })
      
      const summaryData = {
        total_pages: scrapingData.summary?.totalPages || 0,
        total_links: scrapingData.summary?.totalLinks || 0,
        total_images: scrapingData.summary?.totalImages || 0,
        total_meta_tags: scrapingData.summary?.totalMetaTags || 0,
        technologies_found: scrapingData.summary?.technologiesFound || 0,
        cms_detected: scrapingData.summary?.cmsDetected || false,
        ...cmsData, // Spread CMS data
        ...technologiesData, // Spread technologies data
        total_html_content: scrapingData.summary?.totalHtmlContent || 0,
        average_html_per_page: scrapingData.summary?.averageHtmlPerPage || 0,
        pages_per_second: scrapingData.performance?.pagesPerSecond || 0,
        total_response_time: scrapingData.performance?.totalTime || 0,
        all_pages_html: allPagesHtml, // Store all pages HTML in new column
        images: allImages, // Store aggregated images data from all pages
        links: allLinks, // Store aggregated links data from all pages
        scraping_completed_at: new Date().toISOString(),
        scraping_data: {
          ...scrapingData,
          all_pages_html: allPagesHtml // Also store in scraping_data as backup
        },
        status: 'completed' as const,
        progress: 100
      }
      
      console.log('💾 Summary data prepared with allPagesHtml:', {
        hasAllPagesHtml: !!summaryData.all_pages_html,
        allPagesHtmlLength: summaryData.all_pages_html?.length || 0,
        hasScrapingDataBackup: !!summaryData.scraping_data?.all_pages_html,
        scrapingDataBackupLength: summaryData.scraping_data?.all_pages_html?.length || 0
      })
      
      // Log the exact data being sent to database
     
      console.log('🚀 Attempting to save to database...')
      const { error: updateError } = await updateAuditProject(projectId, summaryData)
      
      if (updateError) {
        console.error('❌ Database update failed:', updateError)
        console.error('❌ Error updating audit project with summary:', updateError)
        console.error('❌ Update error details:', JSON.stringify(updateError, null, 2))
        
        // Check if the error is related to missing columns
        if (updateError.message && (updateError.message.includes('all_pages_html') || updateError.message.includes('images') || updateError.message.includes('links'))) {
          console.warn('⚠️ Some columns may not exist in database')
          console.warn('💡 You need to add these columns to your audit_projects table:')
          console.warn('   ALTER TABLE audit_projects ADD COLUMN all_pages_html JSONB;')
          console.warn('   ALTER TABLE audit_projects ADD COLUMN images JSONB;')
          console.warn('   ALTER TABLE audit_projects ADD COLUMN links JSONB;')
          
          // Try updating without the problematic fields
          const { all_pages_html: _all_pages_html, images: _images, links: _links, ...summaryDataWithoutNewFields } = summaryData
          
          
          const { error: retryError } = await updateAuditProject(projectId, summaryDataWithoutNewFields)
          if (retryError) {
            console.error('❌ Retry also failed:', retryError)
            onScrapingComplete(false)
            return
          } else {
            
            
          }
        } else {
          onScrapingComplete(false)
          return
        }
      } else {
        console.log('✅ Database update successful!')
        console.log('🔍 Verifying saved data...')
        
        // Verify the data was saved by fetching it back
        try {
          const { data: verifyData, error: verifyError } = await getAuditProject(projectId)
          if (verifyError) {
            console.warn('⚠️ Could not verify saved data:', verifyError)
          } else {
            console.log('🔍 Verification data retrieved successfully')
            console.log('📊 Verification data summary:', {
              hasAllPagesHtml: !!verifyData?.all_pages_html,
              allPagesHtmlLength: verifyData?.all_pages_html?.length || 0,
              hasScrapingData: !!verifyData?.scraping_data,
              hasScrapingDataAllPagesHtml: !!verifyData?.scraping_data?.all_pages_html,
              scrapingDataAllPagesHtmlLength: verifyData?.scraping_data?.all_pages_html?.length || 0
            })
            
            // Check if HTML content is saved in any location
            const htmlSavedInAllPagesHtml = verifyData?.all_pages_html && verifyData.all_pages_html.length > 0
            const htmlSavedInScrapingData = verifyData?.scraping_data?.all_pages_html && verifyData.scraping_data.all_pages_html.length > 0
            
            if (htmlSavedInAllPagesHtml) {
              console.log('✅ HTML content successfully saved in all_pages_html column')
              console.log('📈 all_pages_html details:', {
                totalPages: verifyData.all_pages_html?.length || 0,
                sampleUrls: verifyData.all_pages_html?.slice(0, 3).map((p: any) => p.url) || [],
                totalHtmlSize: verifyData.all_pages_html?.reduce((sum: number, p: any) => sum + (p.html?.length || 0), 0) || 0
              })
            } else if (htmlSavedInScrapingData) {
              console.log('✅ HTML content successfully saved in scraping_data.all_pages_html (backup location)')
              console.log('📈 scraping_data.all_pages_html details:', {
                totalPages: verifyData.scraping_data.all_pages_html.length,
                sampleUrls: verifyData.scraping_data.all_pages_html.slice(0, 3).map((p: any) => p.url),
                totalHtmlSize: verifyData.scraping_data.all_pages_html.reduce((sum: number, p: any) => sum + (p.html?.length || 0), 0)
              })
            } else {
              console.warn('⚠️ HTML content not found in either location - this indicates a database issue')
              console.warn('🔍 Available data keys:', Object.keys(verifyData || {}))
            }
          }
        } catch (verifyErr) {
          console.warn('⚠️ Verification failed:', verifyErr)
        }
        
        onScrapingComplete(true)
        
        // Instead of redirecting, let the parent component handle the update
        // This prevents the need for page refresh
        console.log('✅ Scraping completed successfully - data should update automatically')
      }

    } catch (error) {
      console.error('❌ Error processing scraping data:', error)
      onScrapingComplete(false)
    }
  }

  // Process data when component receives it using useEffect
  useEffect(() => {
    if (!projectId || !scrapingData || isProcessing.current) {
      return
    }

    // Create a unique key for this data to prevent duplicate processing
    const dataKey = `${projectId}-${JSON.stringify(scrapingData)}`
    
    // Check if we've already processed this exact data
    if (processedDataRef.current === dataKey) {
      
      return
    }

    // Mark as processing and set the processed data key
    isProcessing.current = true
    processedDataRef.current = dataKey

    processScrapingData(scrapingData, projectId).finally(() => {
      isProcessing.current = false
    })
  }, [projectId, scrapingData, processScrapingData])

  return null // This component doesn't render anything
}