'use client'

import { useEffect, useRef } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'

interface ScrapingServiceProps {
  projectId: string | null
  scrapingData: any
  onScrapingComplete: (success: boolean) => void
}

export default function ScrapingService({ projectId, scrapingData, onScrapingComplete }: ScrapingServiceProps) {
  const { createScrapedPages, updateAuditProject } = useSupabase()
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
      console.log('🔍 Processing scraping data...', scrapingData)
      
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found in scraping response')
        onScrapingComplete(false)
        return
      }

      // Prepare scraped pages data
      const scrapedPagesData = scrapingData.pages.map((page: any) => ({
        audit_project_id: projectId,
        url: page.url,
        status_code: page.statusCode,
        title: page.title,
        description: page.metaTags?.find((tag: any) => tag.name === 'description')?.content || null,
        html_content: page.html,
        html_content_length: page.htmlContentLength,
        links_count: page.links?.length || 0,
        images_count: page.images?.length || 0,
        meta_tags_count: page.metaTags?.length || 0,
        technologies_count: page.technologies?.length || 0,
        technologies: page.technologies || null,
        cms_type: scrapingData.extractedData?.cms?.type || null,
        cms_version: scrapingData.extractedData?.cms?.version || null,
        cms_plugins: scrapingData.extractedData?.cms?.plugins || null,
        is_external: false, // Main page is not external
        response_time: scrapingData.responseTime
      }))

      console.log('📊 Prepared scraped pages data:', scrapedPagesData)

      // Save scraped pages to database
      const { data: savedPages, error: pagesError } = await createScrapedPages(scrapedPagesData)
      
      if (pagesError) {
        console.error('❌ Error saving scraped pages:', pagesError)
        onScrapingComplete(false)
        return
      } else {
        console.log('✅ Scraped pages saved successfully:', savedPages?.length || 0, 'pages')
      }

      // Process CMS data to avoid repetition and extract unique information
      const cmsData = processCmsData(scrapingData.extractedData?.cms)
      
      // Process technologies data to avoid repetition and extract unique information
      const technologiesData = processTechnologiesData(
        scrapingData.extractedData?.technologies,
        scrapingData.summary?.technologies
      )
      
      // Update audit project with summary data
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
        scraping_completed_at: new Date().toISOString(),
        scraping_data: scrapingData,
        status: 'completed' as const,
        progress: 100
      }

      console.log('📊 Updating audit project with summary data:', summaryData)

      const { error: updateError } = await updateAuditProject(projectId, summaryData)
      
      if (updateError) {
        console.error('❌ Error updating audit project with summary:', updateError)
        onScrapingComplete(false)
        return
      } else {
        console.log('✅ Audit project updated with summary data successfully')
        onScrapingComplete(true)
        
        // Redirect to dashboard with analysis tab after successful completion
        setTimeout(() => {
          window.location.href = `/dashboard?tab=analysis&projectId=${projectId}`
        }, 1000) // Small delay to show success state
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
      console.log('⚠️ Data already processed, skipping...')
      return
    }

    // Mark as processing and set the processed data key
    isProcessing.current = true
    processedDataRef.current = dataKey

    processScrapingData(scrapingData, projectId).finally(() => {
      isProcessing.current = false
    })
  }, [projectId, scrapingData])

  return null // This component doesn't render anything
}
