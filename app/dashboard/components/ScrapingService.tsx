'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { filterHtmlContent } from '@/lib/html-content-filter';

// Type definitions
interface Plugin {
  name: string;
  version: string | null;
  active: boolean;
  path: string | null;
  description: string | null;
  author: string | null;
  confidence: number;
  detection_method: string;
}
interface Theme {
  name: string;
  version: string | null;
  active: boolean;
  path: string | null;
  description: string | null;
  author: string | null;
  confidence: number;
  detection_method: string;
}
interface Component {
  name: string;
  type: string;
  version: string | null;
  active: boolean;
  path: string | null;
  description: string | null;
  confidence: number;
  detection_method: string;
}
interface Technology {
  name: string;
  version: string | null;
  category: string;
  confidence: number;
  detection_method: string;
  description: string | null;
  website: string | null;
  icon: string | null;
  first_seen?: string;
  last_seen?: string;
}
interface SocialMetaTag {
  name: string;
  property: string;
  content: string;
  httpEquiv?: string;
}
interface MetaTag {
  name: string;
  content: string;
}
interface Link {
  href: string;
  text: string;
  [key: string]: unknown;
}
interface Image {
  src: string;
  alt: string;
  [key: string]: unknown;
}
interface Page {
  url: string;
  statusCode: number;
  title: string;
  html: string;
  htmlContentLength: number;
  links?: Link[];
  images?: Image[];
  metaTags?: MetaTag[];
  technologies?: Technology[];
}
interface CmsData {
  type?: string;
  version?: string;
  plugins?: Plugin[];
  themes?: Theme[];
  components?: Component[];
  confidence?: number;
  detection_method?: string;
  metadata?: Record<string, unknown>;
}
interface ExtractedData {
  cms?: CmsData;
  technologies?: Technology[];
}
interface Summary {
  totalPages?: number;
  totalLinks?: number;
  totalImages?: number;
  totalMetaTags?: number;
  technologiesFound?: number;
  cmsDetected?: boolean;
  technologies?: string[];
  totalHtmlContent?: number;
  averageHtmlPerPage?: number;
}
interface Performance {
  pagesPerSecond?: number;
  totalTime?: number;
}
interface ScrapingData {
  pages: Page[];
  extractedData?: ExtractedData;
  summary?: Summary;
  performance?: Performance;
  responseTime?: number;
}
interface PageData {
  pageName: string;
  pageUrl: string;
  pageHtml: string;
}
interface ProcessedCmsData {
  cms_type: string | null;
  cms_version: string | null;
  cms_plugins: Plugin[] | null;
  cms_themes: Theme[] | null;
  cms_components: Component[] | null;
  cms_confidence: number;
  cms_detection_method: string | null;
  cms_metadata: Record<string, unknown> | null;
}
interface ProcessedTechnologiesData {
  technologies: Technology[] | null;
  technologies_confidence: number;
  technologies_detection_method: string | null;
  technologies_metadata: Record<string, unknown> | null;
}
interface ScrapingServiceProps {
  projectId: string | null;
  scrapingData: ScrapingData;
  onScrapingComplete: (success: boolean) => void;
}
export default function ScrapingService({
  projectId,
  scrapingData,
  onScrapingComplete
}: ScrapingServiceProps) {
  const {
    createScrapedPages,
    updateAuditProject,
    processMetaTagsData,
    getAuditProject
  } = useSupabase();
  const isProcessing = useRef(false);
  const processedDataRef = useRef<string | null>(null);

  // Function to process CMS data and remove duplicates
  const processCmsData = (cmsData: CmsData | undefined): ProcessedCmsData => {
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
    const uniquePlugins = cmsData.plugins ? cmsData.plugins.reduce((acc: Plugin[], plugin: Plugin) => {
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
        if ((plugin.confidence || 0.8) > existing.confidence) {
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
    const uniqueThemes = cmsData.themes ? cmsData.themes.reduce((acc: Theme[], theme: Theme) => {
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
        if ((theme.confidence || 0.8) > existing.confidence) {
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
    const uniqueComponents = cmsData.components ? cmsData.components.reduce((acc: Component[], component: Component) => {
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
        if ((component.confidence || 0.8) > existing.confidence) {
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
        active_plugins: uniquePlugins?.filter((p: Plugin) => p.active).length || 0,
        active_themes: uniqueThemes?.filter((t: Theme) => t.active).length || 0,
        active_components: uniqueComponents?.filter((c: Component) => c.active).length || 0,
        ...cmsData.metadata
      }
    };
  };

  // Function to process technologies data and remove duplicates
  const processTechnologiesData = (technologiesData: Technology[] | undefined, summaryTechnologies: string[] = []): ProcessedTechnologiesData => {
    // Combine both detailed technologies and summary technologies
    const allTechnologies: Technology[] = [];

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
    const uniqueTechnologies = allTechnologies.reduce((acc: Technology[], tech: Technology) => {
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
        if ((tech.confidence || 0.8) > existing.confidence) {
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
    const overallConfidence = uniqueTechnologies.length > 0 ? uniqueTechnologies.reduce((sum, tech) => sum + tech.confidence, 0) / uniqueTechnologies.length : 0;

    // Group technologies by category
    const technologiesByCategory = uniqueTechnologies.reduce((acc: Record<string, Technology[]>, tech: Technology) => {
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
        high_confidence_technologies: uniqueTechnologies.filter((t: Technology) => t.confidence >= 0.8).length,
        medium_confidence_technologies: uniqueTechnologies.filter((t: Technology) => t.confidence >= 0.5 && t.confidence < 0.8).length,
        low_confidence_technologies: uniqueTechnologies.filter((t: Technology) => t.confidence < 0.5).length
      }
    };
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
        const extractedTags: SocialMetaTag[] = [];
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

      // Prepare scraped pages data (including HTML content for individual pages)
      const scrapedPagesData = scrapingData.pages.map((page: Page) => {
        const {
          socialMetaTags,
          count: socialMetaTagsCount
        } = extractSocialMetaTags(page.html);

        // Filter HTML content to get pure text content

        const filteredContent = filterHtmlContent(page.html);
        return {
          audit_project_id: projectId,
          url: page.url,
          status_code: page.statusCode,
          title: page.title,
          description: page.metaTags?.find((tag: MetaTag) => tag.name === 'description')?.content || null,
          html_content: page.html,
          // Keep original HTML content
          html_content_length: page.htmlContentLength,
          // Keep original HTML length
          filtered_content: filteredContent.pureContent,
          // Store filtered pure text content in new column
          filtered_content_length: filteredContent.filteredLength,
          // Store filtered content length
          links_count: page.links?.length || 0,
          images_count: page.images?.length || 0,
          links: page.links || null,
          // Store actual links data
          images: page.images || null,
          // Store actual images data
          meta_tags_count: page.metaTags?.length || 0,
          technologies_count: page.technologies?.length || 0,
          technologies: page.technologies?.map(tech => tech.name) || null,
          cms_type: scrapingData.extractedData?.cms?.type || null,
          cms_version: scrapingData.extractedData?.cms?.version || null,
          cms_plugins: scrapingData.extractedData?.cms?.plugins?.map(plugin => plugin.name) || null,
          social_meta_tags: socialMetaTags,
          // Store full social meta tags data
          social_meta_tags_count: socialMetaTagsCount,
          // Store count as well
          is_external: false,
          // Main page is not external
          response_time: scrapingData.responseTime || null,
          performance_analysis: null // Initialize as null, will be populated later
        };
      });

      // Save scraped pages to database
      const {
        error: pagesError
      } = await createScrapedPages(scrapedPagesData);
      if (pagesError) {
        console.error('❌ Error saving scraped pages:', pagesError);
        onScrapingComplete(false);
        return;
      } else {}

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
      // Extract HTML content from all pages

      const allPagesHtml = scrapingData.pages.map((page: Page, index: number): PageData => {
        // Create simplified page data structure
        const pageData = {
          pageName: page.title || `Page ${index + 1}`,
          pageUrl: page.url,
          pageHtml: page.html || ''
        };
        return pageData;
      });
      // Log first page HTML sample for debugging
      if (allPagesHtml.length > 0 && allPagesHtml[0].pageHtml) {}

      // Update audit project with summary data

      // Aggregate images and links from all pages

      const allImages: (Image & {
        page_url: string;
        page_title: string;
        page_index: number;
      })[] = [];
      const allLinks: (Link & {
        page_url: string;
        page_title: string;
        page_index: number;
      })[] = [];
      scrapingData.pages.forEach((page: Page, index: number) => {
        // Add images with page context
        if (page.images && Array.isArray(page.images)) {
          page.images.forEach((image: Image) => {
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
          page.links.forEach((link: Link) => {
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
        total_html_content: scrapingData.summary?.totalHtmlContent || 0,
        average_html_per_page: scrapingData.summary?.averageHtmlPerPage || 0,
        pages_per_second: scrapingData.performance?.pagesPerSecond || 0,
        total_response_time: scrapingData.performance?.totalTime || 0,
        all_pages_html: allPagesHtml,
        // Store all pages HTML in new column
        images: allImages,
        // Store aggregated images data from all pages
        links: allLinks,
        // Store aggregated links data from all pages
        scraping_completed_at: new Date().toISOString(),
        scraping_data: {
          ...scrapingData,
          all_pages_html: allPagesHtml // Also store in scraping_data as backup
        },
        status: 'completed' as const,
        progress: 100
      };

      // Log the exact data being sent to database

      const {
        error: updateError
      } = await updateAuditProject(projectId, summaryData);
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        console.error('❌ Error updating audit project with summary:', updateError);
        console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));

        // Check if the error is related to missing columns
        if (updateError.message && (updateError.message.includes('all_pages_html') || updateError.message.includes('images') || updateError.message.includes('links'))) {
          console.warn('⚠️ Some columns may not exist in database');
          console.warn('💡 You need to add these columns to your audit_projects table:');
          console.warn('   ALTER TABLE audit_projects ADD COLUMN all_pages_html JSONB;');
          console.warn('   ALTER TABLE audit_projects ADD COLUMN images JSONB;');
          console.warn('   ALTER TABLE audit_projects ADD COLUMN links JSONB;');

          // Try updating without the problematic fields
          const {
            all_pages_html,
            images,
            links,
            ...summaryDataWithoutNewFields
          } = summaryData;
          const {
            error: retryError
          } = await updateAuditProject(projectId, summaryDataWithoutNewFields);
          if (retryError) {
            console.error('❌ Retry also failed:', retryError);
            onScrapingComplete(false);
            return;
          } else {}
        } else {
          onScrapingComplete(false);
          return;
        }
      } else {
        // Verify the data was saved by fetching it back
        try {
          const {
            data: verifyData,
            error: verifyError
          } = await getAuditProject(projectId);
          if (verifyError) {
            console.warn('⚠️ Could not verify saved data:', verifyError);
          } else {
            // Check if HTML content is saved in any location
            const htmlSavedInAllPagesHtml = verifyData?.all_pages_html && verifyData.all_pages_html.length > 0;
            const htmlSavedInScrapingData = verifyData?.scraping_data?.all_pages_html && verifyData.scraping_data.all_pages_html.length > 0;
            if (htmlSavedInAllPagesHtml) {} else if (htmlSavedInScrapingData) {} else {
              console.warn('⚠️ HTML content not found in either location - this indicates a database issue');
              console.warn('🔍 Available data keys:', Object.keys(verifyData || {}));
            }
          }
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
  }, [onScrapingComplete, createScrapedPages, updateAuditProject, processMetaTagsData, getAuditProject]);

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