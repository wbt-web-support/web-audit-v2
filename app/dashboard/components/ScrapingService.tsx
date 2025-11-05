'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { detectKeysInPages } from '@/lib/key-detection';
import { supabase } from '@/lib/supabase-client';
interface ScrapingServiceProps {
  projectId: string | null;
  scrapingData: ScrapingData;
  onScrapingComplete: (success: boolean) => void;
  forceProcess?: boolean;
}
interface ScrapingData {
  pages: PageData[];
  extractedData?: {
    cms?: CmsData;
    technologies?: TechnologyData[];
  };
  summary?: {
    totalPages?: number;
    totalLinks?: number;
    totalImages?: number;
    totalMetaTags?: number;
    technologiesFound?: number;
    cmsDetected?: boolean;
    technologies?: string[];
    totalHtmlContent?: number;
    averageHtmlPerPage?: number;
  };
  performance?: {
    pagesPerSecond?: number;
    totalTime?: number;
  };
  responseTime?: number;
}
interface PageData {
  url: string;
  statusCode: number;
  title: string;
  html: string;
  htmlContentLength: number;
  links?: LinkData[];
  images?: ImageData[];
  metaTags?: MetaTagData[];
  technologies?: TechnologyData[];
}
interface LinkData {
  href: string;
  text: string;
  title?: string;
  target?: string;
  rel?: string;
}
interface ImageData {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
}
interface MetaTagData {
  name?: string;
  property?: string;
  content: string;
  httpEquiv?: string;
}
interface TechnologyData {
  name: string;
  version?: string | null;
  category?: string;
  confidence?: number;
  detection_method?: string | null;
  description?: string | null;
  website?: string | null;
  icon?: string | null;
  first_seen?: string;
  last_seen?: string;
}
interface CmsData {
  type?: string;
  version?: string;
  plugins?: PluginData[];
  themes?: ThemeData[];
  components?: ComponentData[];
  confidence?: number;
  detection_method?: string;
  metadata?: Record<string, unknown>;
}
interface PluginData {
  name: string;
  version?: string | null;
  active?: boolean;
  path?: string | null;
  description?: string | null;
  author?: string | null;
  confidence?: number;
  detection_method?: string | null;
}
interface ThemeData {
  name: string;
  version?: string | null;
  active?: boolean;
  path?: string | null;
  description?: string | null;
  author?: string | null;
  confidence?: number;
  detection_method?: string | null;
}
interface ComponentData {
  name: string;
  type: string;
  version?: string | null;
  active?: boolean;
  path?: string | null;
  description?: string | null;
  confidence?: number;
  detection_method?: string | null;
}
export default function ScrapingService({
  projectId,
  scrapingData,
  onScrapingComplete
}: ScrapingServiceProps) {
  const {
    createScrapedPages,
    createScrapedImages,
    updateAuditProject,
    processMetaTagsData,
    getAuditProject
  } = useSupabase();
  const isProcessing = useRef(false);
  const processedDataRef = useRef<string | null>(null);

  // Function to process CMS data and remove duplicates
  const processCmsData = (cmsData: CmsData | null | undefined) => {
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
      };
    }

    // Process plugins - remove duplicates and add metadata
    const uniquePlugins = cmsData.plugins ? cmsData.plugins.reduce((acc: PluginData[], plugin: PluginData) => {
      const existing = acc.find(p => p.name === plugin.name);
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
        });
      } else {
        // Update existing plugin with higher confidence or more info
        if ((plugin.confidence || 0.8) > (existing.confidence || 0)) {
          Object.assign(existing, {
            version: plugin.version || existing.version,
            active: plugin.active !== false ? plugin.active : existing.active,
            path: plugin.path || existing.path,
            description: plugin.description || existing.description,
            author: plugin.author || existing.author,
            confidence: plugin.confidence || existing.confidence,
            detection_method: plugin.detection_method || existing.detection_method
          });
        }
      }
      return acc;
    }, []) : null;

    // Process themes - remove duplicates and add metadata
    const uniqueThemes = cmsData.themes ? cmsData.themes.reduce((acc: ThemeData[], theme: ThemeData) => {
      const existing = acc.find(t => t.name === theme.name);
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
        });
      } else {
        // Update existing theme with higher confidence or more info
        if ((theme.confidence || 0.8) > (existing.confidence || 0)) {
          Object.assign(existing, {
            version: theme.version || existing.version,
            active: theme.active !== false ? theme.active : existing.active,
            path: theme.path || existing.path,
            description: theme.description || existing.description,
            author: theme.author || existing.author,
            confidence: theme.confidence || existing.confidence,
            detection_method: theme.detection_method || existing.detection_method
          });
        }
      }
      return acc;
    }, []) : null;

    // Process components - remove duplicates and add metadata
    const uniqueComponents = cmsData.components ? cmsData.components.reduce((acc: ComponentData[], component: ComponentData) => {
      const existing = acc.find(c => c.name === component.name && c.type === component.type);
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
        });
      } else {
        // Update existing component with higher confidence or more info
        if ((component.confidence || 0.8) > (existing.confidence || 0)) {
          Object.assign(existing, {
            version: component.version || existing.version,
            active: component.active !== false ? component.active : existing.active,
            path: component.path || existing.path,
            description: component.description || existing.description,
            confidence: component.confidence || existing.confidence,
            detection_method: component.detection_method || existing.detection_method
          });
        }
      }
      return acc;
    }, []) : null;
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
        active_plugins: uniquePlugins?.filter((p: PluginData) => p.active).length || 0,
        active_themes: uniqueThemes?.filter((t: ThemeData) => t.active).length || 0,
        active_components: uniqueComponents?.filter((c: ComponentData) => c.active).length || 0,
        ...cmsData.metadata
      }
    };
  };

  // Function to process technologies data and remove duplicates
  const processTechnologiesData = (technologiesData: TechnologyData[] | null | undefined, summaryTechnologies: string[] = []) => {
    // Combine both detailed technologies and summary technologies
    const allTechnologies: TechnologyData[] = [];

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
          });
        } else if (typeof tech === 'object' && tech !== null) {
          // It's a detailed technology object
          allTechnologies.push(tech);
        }
      });
    }

    // Add summary technologies as simple objects
    if (summaryTechnologies && Array.isArray(summaryTechnologies)) {
      summaryTechnologies.forEach(techName => {
        allTechnologies.push({
          name: techName,
          version: null,
          category: 'unknown',
          confidence: 0.9,
          // Higher confidence for summary technologies
          detection_method: 'summary',
          description: null,
          website: null,
          icon: null
        });
      });
    }
    if (allTechnologies.length === 0) {
      return {
        technologies: null,
        technologies_confidence: 0,
        technologies_detection_method: null,
        technologies_metadata: null
      };
    }

    // Process technologies - remove duplicates and add metadata
    const uniqueTechnologies = allTechnologies.reduce((acc: TechnologyData[], tech: TechnologyData) => {
      const existing = acc.find(t => t.name === tech.name && t.category === (tech.category || 'unknown'));
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
        });
      } else {
        // Update existing technology with higher confidence or more info
        if ((tech.confidence || 0.8) > (existing.confidence || 0)) {
          Object.assign(existing, {
            version: tech.version || existing.version,
            confidence: tech.confidence || existing.confidence,
            detection_method: tech.detection_method || existing.detection_method,
            description: tech.description || existing.description,
            website: tech.website || existing.website,
            icon: tech.icon || existing.icon,
            last_seen: new Date().toISOString()
          });
        } else {
          // Update last_seen even if confidence is lower
          existing.last_seen = new Date().toISOString();
        }
      }
      return acc;
    }, []);

    // Calculate overall confidence
    const overallConfidence = uniqueTechnologies.length > 0 ? uniqueTechnologies.reduce((sum, tech) => sum + (tech.confidence || 0), 0) / uniqueTechnologies.length : 0;

    // Group technologies by category
    const technologiesByCategory = uniqueTechnologies.reduce((acc: Record<string, TechnologyData[]>, tech: TechnologyData) => {
      const category = tech.category || 'unknown';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tech);
      return acc;
    }, {});
    return {
      technologies: uniqueTechnologies,
      technologies_confidence: overallConfidence,
      technologies_detection_method: 'mixed',
      // Could be more specific based on detection methods
      technologies_metadata: {
        detection_timestamp: new Date().toISOString(),
        total_technologies: uniqueTechnologies.length,
        categories: Object.keys(technologiesByCategory),
        technologies_by_category: technologiesByCategory,
        high_confidence_technologies: uniqueTechnologies.filter((t: TechnologyData) => (t.confidence || 0) >= 0.8).length,
        medium_confidence_technologies: uniqueTechnologies.filter((t: TechnologyData) => (t.confidence || 0) >= 0.5 && (t.confidence || 0) < 0.8).length,
        low_confidence_technologies: uniqueTechnologies.filter((t: TechnologyData) => (t.confidence || 0) < 0.5).length
      }
    };
  };

  // Function to process keys detection from all pages
  const processKeysDetection = async (scrapingData: ScrapingData, _projectId: string) => {
    try {
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found for keys detection');
        return null;
      }

      // Prepare pages data for key detection
      const pagesForDetection = scrapingData.pages.map((page: PageData, index: number) => ({
        pageName: page.title || `Page ${index + 1}`,
        pageUrl: page.url,
        pageHtml: page.html
      }));
      // Detect keys in all pages
      const keyDetectionResult = await detectKeysInPages(pagesForDetection);
      return keyDetectionResult;
    } catch (error) {
      console.error('❌ Keys detection failed:', error);
      return null;
    }
  };

  // Function to process scraping data and save to database
  const processScrapingData = useCallback(async (scrapingData: ScrapingData, projectId: string) => {
    try {
      if (!scrapingData.pages || !Array.isArray(scrapingData.pages)) {
        console.warn('⚠️ No pages data found in scraping response');
        onScrapingComplete(false);
        return;
      }

      // Function to extract all social media meta tags from HTML content
      const extractSocialMetaTags = (htmlContent: string) => {
        if (!htmlContent) return {
          socialMetaTags: [],
          count: 0
        };
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

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
        `);
        const extractedTags: MetaTagData[] = [];
        socialMetaTags.forEach(tag => {
          const element = tag as HTMLMetaElement;
          extractedTags.push({
            name: element.name || '',
            property: element.getAttribute('property') || '',
            content: element.content || '',
            httpEquiv: element.getAttribute('http-equiv') || undefined
          });
        });
        return {
          socialMetaTags: extractedTags,
          count: extractedTags.length
        };
      };

      // Helper to sanitize strings for DB (remove null bytes that Postgres rejects)
      const sanitizeString = (value: string | null | undefined) => {
        if (typeof value !== 'string') return value || '';
        return value.replace(/\u0000/g, '');
      };

      // Prepare scraped pages data (including HTML content for individual pages)
      const scrapedPagesData = scrapingData.pages.map((page: PageData) => {
        const {
          socialMetaTags,
          count: socialMetaTagsCount
        } = extractSocialMetaTags(page.html);

        // Validate required fields
        if (!page.url) {
          console.warn('⚠️ Page missing URL, skipping:', page);
          return null;
        }
        return {
          audit_project_id: projectId,
          url: page.url,
          status_code: page.statusCode || 200,
          title: sanitizeString(page.title || ''),
          description: sanitizeString(page.metaTags?.find((tag: MetaTagData) => tag.name === 'description')?.content || null || ''),
          html_content: sanitizeString(page.html || ''),
          // Ensure HTML content is not null
          html_content_length: page.htmlContentLength || 0,
          // Ensure numeric value
          links_count: page.links?.length || 0,
          images_count: page.images?.length || 0,
          links: page.links || null,
          // Store actual links data
          images: page.images || null,
          // Store actual images data
          meta_tags_count: page.metaTags?.length || 0,
          technologies_count: page.technologies?.length || 0,
          technologies: page.technologies?.map(tech => tech.name).filter(tech => tech !== null && tech !== undefined && tech !== '') || null,
          cms_type: scrapingData.extractedData?.cms?.type || null,
          cms_version: scrapingData.extractedData?.cms?.version || null,
          cms_plugins: scrapingData.extractedData?.cms?.plugins?.map(plugin => plugin.name).filter(plugin => plugin !== null && plugin !== undefined && plugin !== '') || null,
          social_meta_tags: socialMetaTags,
          // Store full social meta tags data
          social_meta_tags_count: socialMetaTagsCount,
          // Store count as well
          is_external: false,
          // Main page is not external
          response_time: scrapingData.responseTime || null,
          performance_analysis: null, // Add missing required property
          page_image: null, // Screenshot image data (will be added later)
          Image_gemini_analysis: null // Gemini image analysis (will be added later)
        };
      }).filter(Boolean); // Remove any null entries

      // Validate data before saving
      if (!scrapedPagesData || scrapedPagesData.length === 0) {
        console.error('❌ No scraped pages data to save');
        onScrapingComplete(false);
        return;
      }

      // Validate each page has required fields
      const invalidPages = scrapedPagesData.filter(page => page && (!page.url || !page.audit_project_id));
      if (invalidPages.length > 0) {
        console.error('❌ Invalid pages found:', invalidPages);
        onScrapingComplete(false);
        return;
      }

      // Save scraped pages to database
      const filteredPages = scrapedPagesData.filter((page): page is NonNullable<typeof page> => page !== null);

      // Log the exact data structure being sent

      let savedPages: any[] | null = null;
      const {
        data: pagesData,
        error: pagesError
      } = await createScrapedPages(filteredPages);
      
      if (pagesError) {
        console.error('❌ Error saving scraped pages:', {
          error: pagesError,
          message: pagesError.message,
          details: pagesError.details,
          code: pagesError.code,
          fullError: JSON.stringify(pagesError, null, 2)
        });

        // Log the data that failed to save
        console.error('❌ Failed to save data:', {
          scrapedPagesDataLength: scrapedPagesData.length,
          sampleData: scrapedPagesData[0],
          projectId: projectId
        });

        // Try to save individual pages if bulk insert fails

        let successCount = 0;
        let _errorCount = 0;
        let savedPagesList: any[] = [];
        for (const pageData of scrapedPagesData) {
          if (!pageData) continue;
          try {
            const {
              data: singlePageData,
              error: singlePageError
            } = await createScrapedPages([pageData]);
            if (singlePageError) {
              console.error(`❌ Failed to save individual page ${pageData.url}:`, singlePageError);
              _errorCount++;
            } else {
              successCount++;
              if (singlePageData && singlePageData[0]) {
                savedPagesList.push(singlePageData[0]);
              }
            }
          } catch (err) {
            console.error(`❌ Exception saving individual page ${pageData.url}:`, err);
            _errorCount++;
          }
        }
        if (successCount === 0) {
          onScrapingComplete(false);
          return;
        }
        // Use savedPagesList for image saving if bulk insert failed
        savedPages = savedPagesList.length > 0 ? savedPagesList : null;
      } else {
        savedPages = pagesData;
      }

      // Save images to separate table after pages are saved
      if (savedPages && savedPages.length > 0) {
        try {
          // Create a map of page URL to page ID for quick lookup
          const pageUrlToIdMap = new Map<string, string>();
          savedPages.forEach((page: any) => {
            if (page && page.url && page.id) {
              pageUrlToIdMap.set(page.url, page.id);
            }
          });

          // Extract all images from scraped pages and prepare them for database
          const imagesToSave: Array<{
            scraped_page_id: string;
            audit_project_id: string | null;
            original_url: string;
            alt_text: string | null;
            title_text: string | null;
            width: number | null;
            height: number | null;
            type: string | null;
            size_bytes: number | null;
            scan_results: any | null;
            extra_metadata: any | null;
          }> = [];

          scrapingData.pages.forEach((page: PageData) => {
            const pageId = pageUrlToIdMap.get(page.url);
            if (!pageId || !page.images || !Array.isArray(page.images)) {
              return;
            }

            page.images.forEach((image: ImageData) => {
              // Extract image type from URL if available
              const imageUrl = image.src || '';
              let imageType: string | null = null;
              if (imageUrl) {
                const match = imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i);
                if (match) {
                  imageType = match[1].toLowerCase();
                }
              }

              imagesToSave.push({
                scraped_page_id: pageId,
                audit_project_id: projectId,
                original_url: imageUrl,
                alt_text: image.alt || null,
                title_text: image.title || null,
                width: image.width || null,
                height: image.height || null,
                type: imageType,
                size_bytes: null, // Can be populated later if needed
                scan_results: null, // Can be populated later with scan results
                extra_metadata: null, // Can store additional metadata here
              });
            });
          });

          // Save images to database if there are any
          if (imagesToSave.length > 0) {
            console.log(`📸 Preparing to save ${imagesToSave.length} images to scraped_images table`);
            
            try {
              // Use API route to bypass RLS policies
              const session = await supabase.auth.getSession();
              const token = session.data.session?.access_token;

              if (!token) {
                console.error('❌ No access token available for image saving');
                // Don't fail the entire process if images fail to save
                return;
              }

              const response = await fetch('/api/scraped-images', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  images: imagesToSave
                })
              });

              const result = await response.json();

              if (!response.ok || result.error) {
                console.error('❌ Error saving scraped images via API:', {
                  error: result.error,
                  message: result.message,
                  details: result.details,
                  code: result.code,
                  imagesCount: imagesToSave.length,
                  sampleImage: imagesToSave[0],
                  status: response.status
                });
                // Don't fail the entire process if images fail to save
              } else {
                const savedCount = result.inserted || result.data?.length || 0;
                console.log(`✅ Successfully saved ${savedCount} out of ${imagesToSave.length} images to scraped_images table`);
                if (savedCount < imagesToSave.length) {
                  console.warn(`⚠️ Only ${savedCount} images were saved, expected ${imagesToSave.length}`);
                }
              }
            } catch (apiError) {
              console.error('❌ Exception calling scraped-images API:', apiError);
              // Don't fail the entire process if images fail to save
            }
          }
        } catch (imagesException) {
          console.error('❌ Exception saving images:', imagesException);
          // Don't fail the entire process if images fail to save
        }
      }

      // Process meta tags data from homepage

      const {
        error: metaTagsError
      } = await processMetaTagsData(projectId);
      if (metaTagsError) {
        console.warn('⚠️ Meta tags processing failed:', metaTagsError);
      } else {}

      // Process CMS data to avoid repetition and extract unique information
      const cmsData = processCmsData(scrapingData.extractedData?.cms);

      // Process technologies data to avoid repetition and extract unique information
      const technologiesData = processTechnologiesData(scrapingData.extractedData?.technologies, scrapingData.summary?.technologies);

      // Process keys detection from all pages

      const keysDetectionResult = await processKeysDetection(scrapingData, projectId);

      // Aggregate images and links from all pages

      const allImages: (ImageData & {
        page_url: string;
        page_title: string;
        page_index: number;
      })[] = [];
      const allLinks: (LinkData & {
        page_url: string;
        page_title: string;
        page_index: number;
      })[] = [];
      scrapingData.pages.forEach((page: PageData, index: number) => {
        // Add images with page context
        if (page.images && Array.isArray(page.images)) {
          page.images.forEach((image: ImageData) => {
            allImages.push({
              ...image,
              page_url: page.url,
              page_title: page.title,
              page_index: index
            });
          });
        }

        // Add links with page context
        if (page.links && Array.isArray(page.links)) {
          page.links.forEach((link: LinkData) => {
            allLinks.push({
              ...link,
              page_url: page.url,
              page_title: page.title,
              page_index: index
            });
          });
        }
      });
      const summaryData = {
        total_pages: scrapingData.summary?.totalPages || 0,
        total_links: scrapingData.summary?.totalLinks || 0,
        total_images: scrapingData.summary?.totalImages || 0,
        total_meta_tags: scrapingData.summary?.totalMetaTags || 0,
        technologies_found: scrapingData.summary?.technologiesFound || 0,
        cms_detected: scrapingData.summary?.cmsDetected || false,
        ...cmsData,
        // Spread CMS data
        ...technologiesData,
        // Spread technologies data
        // Add keys detection data to dedicated column
        detected_keys: keysDetectionResult ? {
          total_keys: keysDetectionResult.summary.totalKeys,
          exposed_keys: keysDetectionResult.summary.exposedKeys,
          secure_keys: keysDetectionResult.summary.secureKeys,
          critical_keys: keysDetectionResult.summary.criticalKeys,
          high_risk_keys: keysDetectionResult.summary.highRiskKeys,
          analysis_complete: keysDetectionResult.summary.analysisComplete,
          processing_time: keysDetectionResult.summary.processingTime,
          detected_keys: keysDetectionResult.allKeys,
          keys_by_page: keysDetectionResult.keysByPage
        } : null,
        total_html_content: scrapingData.summary?.totalHtmlContent || 0,
        average_html_per_page: scrapingData.summary?.averageHtmlPerPage || 0,
        pages_per_second: scrapingData.performance?.pagesPerSecond || 0,
        total_response_time: scrapingData.performance?.totalTime || 0,
        scraping_completed_at: new Date().toISOString(),
        status: 'completed' as const,
        progress: 100
      };

      // Log the exact data being sent to database

      // Store the complete scraping data including favicons
      const completeScrapingData = {
        ...summaryData,
        // Store favicon data in brand_data field (accepts any data)
        brand_data: {
          favicons: (scrapingData as unknown as { summary?: { favicons?: unknown[] } })?.summary?.favicons || [],
          summary: scrapingData.summary
        }
      };

      // Log the scraping data being stored (including favicons)

      const {
        error: updateError
      } = await updateAuditProject(projectId, completeScrapingData);
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        console.error('❌ Error updating audit project with summary:', updateError);
        console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));

        // Check if it's a column not found error
        if (updateError.message?.includes('Could not find') || updateError.code === 'PGRST204') {
          console.warn('⚠️ Some columns may not exist in database');
          console.warn('💡 You may need to add missing columns to your audit_projects table');

          // Try updating with only basic fields
          const basicSummaryData = {
            total_pages: summaryData.total_pages,
            total_links: summaryData.total_links,
            total_images: summaryData.total_images,
            total_meta_tags: summaryData.total_meta_tags,
            technologies_found: summaryData.technologies_found,
            cms_detected: summaryData.cms_detected,
            scraping_completed_at: summaryData.scraping_completed_at,
            status: summaryData.status,
            progress: summaryData.progress
          };
          const {
            error: basicUpdateError
          } = await updateAuditProject(projectId, basicSummaryData);
          if (basicUpdateError) {
            console.error('❌ Basic update also failed:', basicUpdateError);
            onScrapingComplete(false);
            return;
          } else {
            onScrapingComplete(true);
            return;
          }
        }
        onScrapingComplete(false);
        return;
      } else {
        // Verify the data was saved by fetching it back
        try {
          const {
            error: verifyError
          } = await getAuditProject(projectId);
          if (verifyError) {
            console.warn('⚠️ Could not verify saved data:', verifyError);
          } else {}
        } catch (verifyErr) {
          console.warn('⚠️ Verification failed:', verifyErr);
        }
        onScrapingComplete(true);

        // Instead of redirecting, let the parent component handle the update
        // This prevents the need for page refresh
      }
    } catch (error) {
      console.error('❌ Error processing scraping data:', error);
      onScrapingComplete(false);
    }
  }, [createScrapedPages, createScrapedImages, updateAuditProject, processMetaTagsData, getAuditProject, onScrapingComplete]);

  // Process data when component receives it using useEffect
  useEffect(() => {
    if (!projectId || !scrapingData || isProcessing.current) {
      return;
    }

    // Create a unique key for this data to prevent duplicate processing
    const dataKey = `${projectId}-${JSON.stringify(scrapingData)}`;

    // Check if we've already processed this exact data
    if (processedDataRef.current === dataKey) {
      return;
    }

    // Mark as processing and set the processed data key
    isProcessing.current = true;
    processedDataRef.current = dataKey;
    processScrapingData(scrapingData, projectId).finally(() => {
      isProcessing.current = false;
    });
  }, [projectId, scrapingData, processScrapingData]);
  return null; // This component doesn't render anything
}