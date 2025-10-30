import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import type { AuditProjectWithUserId, ScrapedPage } from './supabase-types';
import type { MetaTagsData, SocialMetaTagsData } from '@/types/audit';

// Process and aggregate meta tags data from scraped pages
export const processMetaTagsData = async (
  user: User | null,
  auditProjectId: string
): Promise<{ data: AuditProjectWithUserId | null; error: any }> => {
  if (!user) {
    return {
      data: null,
      error: { message: 'No user logged in' },
    };
  }

  try {
    const { data: scrapedPages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('*')
      .eq('audit_project_id', auditProjectId)
      .eq('user_id', user.id);

    if (pagesError) {
      return { data: null, error: pagesError };
    }

    if (!scrapedPages || scrapedPages.length === 0) {
      return { data: null, error: null };
    }

    const metaTagsData = processAllMetaTags(scrapedPages as ScrapedPage[]);
    const socialMetaTagsData = processAllSocialMetaTags(scrapedPages as ScrapedPage[]);

    try {
      const { data: updatedProject, error: updateError } = await supabase
        .from('audit_projects')
        .update({
          meta_tags_data: metaTagsData,
          social_meta_tags_data: socialMetaTagsData,
        })
        .eq('id', auditProjectId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        const { data: projectData } = await supabase
          .from('audit_projects')
          .select('*')
          .eq('id', auditProjectId)
          .eq('user_id', user.id)
          .single();

        return { data: (projectData || null) as AuditProjectWithUserId | null, error: null };
      }

      return { data: updatedProject as AuditProjectWithUserId, error: null };
    } catch (error) {
      const { data: projectData } = await supabase
        .from('audit_projects')
        .select('*')
        .eq('id', auditProjectId)
        .eq('user_id', user.id)
        .single();

      return { data: (projectData || null) as AuditProjectWithUserId | null, error: null };
    }
  } catch (error) {
    return { data: null, error };
  }
};

// Helper: process meta tags from homepage or first page
export const processAllMetaTags = (scrapedPages: ScrapedPage[]): MetaTagsData => {
  if (!scrapedPages || scrapedPages.length === 0) {
    return {
      all_meta_tags: [],
      standard_meta_tags: {},
      http_equiv_tags: [],
      custom_meta_tags: [],
      total_count: 0,
      pages_with_meta_tags: 0,
      average_meta_tags_per_page: 0,
    } as MetaTagsData;
  }

  const homepage =
    scrapedPages.find((page) => {
      try {
        const url = new URL(page.url);
        const pathname = url.pathname;
        return pathname === '/' || pathname === '' || pathname === '/index.html';
      } catch {
        return false;
      }
    }) || scrapedPages[0];

  const allMetaTags: any[] = [];
  const standardMetaTags: any = {};
  const httpEquivTags: any[] = [];
  const customMetaTags: any[] = [];

  if ((homepage as any).meta_tags_count > 0 && homepage.html_content) {
    const metaTags = extractMetaTagsFromHTML(homepage.html_content);
    allMetaTags.push(...metaTags);

    metaTags.forEach((tag) => {
      if (tag.httpEquiv) {
        httpEquivTags.push(tag);
      } else if (isStandardMetaTag(tag.name)) {
        standardMetaTags[tag.name] = tag.content;
      } else {
        customMetaTags.push(tag);
      }
    });
  }

  return {
    all_meta_tags: allMetaTags,
    standard_meta_tags: standardMetaTags,
    http_equiv_tags: httpEquivTags,
    custom_meta_tags: customMetaTags,
    total_count: (homepage as any).meta_tags_count || 0,
    pages_with_meta_tags: (homepage as any).meta_tags_count > 0 ? 1 : 0,
    average_meta_tags_per_page: (homepage as any).meta_tags_count || 0,
  } as MetaTagsData;
};

// Helper: process social meta tags from homepage only
export const processAllSocialMetaTags = (
  scrapedPages: ScrapedPage[]
): SocialMetaTagsData => {
  if (!scrapedPages || scrapedPages.length === 0) {
    return {
      open_graph: {},
      twitter: {},
      linkedin: {},
      pinterest: {},
      whatsapp: {},
      telegram: {},
      discord: {},
      slack: {},
      total_social_tags: 0,
      social_meta_tags_count: 0,
      platforms_detected: [],
      completeness_score: 0,
      missing_platforms: ['open_graph', 'twitter', 'linkedin', 'pinterest'],
    } as SocialMetaTagsData;
  }

  const homepage =
    scrapedPages.find((page) => {
      try {
        const url = new URL(page.url);
        const pathname = url.pathname;
        return pathname === '/' || pathname === '' || pathname === '/index.html';
      } catch {
        return false;
      }
    }) || scrapedPages[0];

  const platformsDetected: string[] = [];
  const socialMetaTagsCount = (homepage as any).social_meta_tags_count || 0;
  let totalSocialTags = 0;

  if (socialMetaTagsCount > 0) {
    platformsDetected.push('social_meta_tags_detected');
    totalSocialTags = socialMetaTagsCount;
  }

  const expectedPlatforms = ['open_graph', 'twitter', 'linkedin', 'pinterest'];
  const missingPlatforms = expectedPlatforms.filter((p) => !platformsDetected.includes(p));
  const completenessScore = socialMetaTagsCount > 0 ? 50 : 0;

  return {
    open_graph: {},
    twitter: {},
    linkedin: {},
    pinterest: {},
    whatsapp: {},
    telegram: {},
    discord: {},
    slack: {},
    total_social_tags: totalSocialTags,
    social_meta_tags_count: socialMetaTagsCount,
    platforms_detected: platformsDetected,
    completeness_score: completenessScore,
    missing_platforms: missingPlatforms,
  } as SocialMetaTagsData;
};

// Extract meta tags from HTML
export const extractMetaTagsFromHTML = (htmlContent: string): any[] => {
  const metaTags: any[] = [];
  const metaTagRegex = /<meta\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaTagRegex.exec(htmlContent)) !== null) {
    const attributes = match[1];
    const tag: any = {};
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(attributes)) !== null) {
      const [, attrName, attrValue] = attrMatch;
      tag[attrName] = attrValue;
    }

    if (tag.name || tag.property || tag.httpEquiv || tag.charset) {
      metaTags.push({
        name: tag.name || '',
        content: tag.content || '',
        property: tag.property || undefined,
        httpEquiv: tag.httpEquiv || undefined,
        charset: tag.charset || undefined,
      });
    }
  }

  return metaTags;
};

// Check if a meta tag is standard
export const isStandardMetaTag = (name: string): boolean => {
  const standardTags = [
    'title',
    'description',
    'keywords',
    'author',
    'robots',
    'viewport',
    'charset',
    'language',
    'generator',
    'rating',
    'distribution',
    'copyright',
    'reply-to',
    'owner',
    'url',
    'identifier-url',
    'category',
    'coverage',
    'target',
    'handheld-friendly',
    'mobile-optimized',
    'apple-mobile-web-app-capable',
    'apple-mobile-web-app-status-bar-style',
    'apple-mobile-web-app-title',
    'format-detection',
    'theme-color',
    'msapplication-tilecolor',
    'msapplication-config',
  ];

  return standardTags.includes(name.toLowerCase());
};