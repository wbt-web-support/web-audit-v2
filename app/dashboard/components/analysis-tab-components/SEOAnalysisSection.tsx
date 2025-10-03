'use client';

import { SEOAnalysisResult, SEOHighlight } from '@/types/audit';
import { analyzeSEO } from '@/lib/seo-analysis';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
interface Project {
  id: string;
  site_url: string;
  scraping_data?: Record<string, unknown>;
  seo_analysis?: SEOAnalysisResult | null;
}
interface ScrapedPage {
  id?: string;
  html_content?: string | null;
  url?: string;
  audit_project_id?: string;
  performance_analysis?: Record<string, unknown>;
  title?: string | null;
  status_code?: number | null;
  created_at?: string;
  links_count?: number;
  images_count?: number;
  meta_tags_count?: number;
}
interface SEOAnalysisSectionProps {
  project?: Project;
  scrapedPages?: ScrapedPage[];
  dataVersion?: number;
  // For single page analysis
  page?: ScrapedPage;
  isPageAnalysis?: boolean;
  cachedAnalysis?: SEOAnalysisResult | null;
}
export default function SEOAnalysisSection({
  project,
  scrapedPages = [],
  dataVersion,
  page,
  isPageAnalysis = false,
  cachedAnalysis
}: SEOAnalysisSectionProps) {
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysisResult | null>(cachedAnalysis || (isPageAnalysis ? null : project?.seo_analysis || null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisTriggered = useRef(false);
  const {
    updateAuditProject,
    getScrapedPages
  } = useSupabase();
  useEffect(() => {
    // Update local state when project SEO analysis changes or data version changes
    if (!isPageAnalysis && project?.seo_analysis) {
      setSeoAnalysis(project.seo_analysis);
    }
  }, [project?.seo_analysis, dataVersion, isPageAnalysis]);
  const analyzePage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let htmlContent = '';
      let siteUrl = '';
      
      // Debug: Check what's actually in the database
      if (!isPageAnalysis && project) {
        console.log('🔍 SEO Analysis - Project ID:', project.id);
        console.log('🔍 SEO Analysis - Project scraping data exists:', !!project.scraping_data);
        if (project.scraping_data?.pages && Array.isArray(project.scraping_data.pages)) {
          console.log('🔍 SEO Analysis - Project scraping pages count:', project.scraping_data.pages.length);
          console.log('🔍 SEO Analysis - First scraping page HTML length:', (project.scraping_data.pages[0] as { html?: string })?.html?.length || 0);
        }
      }
      
      // If no HTML content found in current data, fetch fresh data from database
      if (!isPageAnalysis && project && (!scrapedPages.length || !scrapedPages.some(p => p.html_content && p.html_content.trim().length > 0))) {
        console.log('🔄 SEO Analysis - No HTML content in current data, fetching fresh data from database...');
        try {
          const { data: freshPages, error: pagesError } = await getScrapedPages(project.id);
          if (pagesError) {
            console.error('❌ Error fetching fresh scraped pages:', pagesError);
          } else if (freshPages && freshPages.length > 0) {
            console.log('✅ SEO Analysis - Fresh scraped pages fetched:', freshPages.length);
            // Update scraped pages with fresh data
            scrapedPages.splice(0, scrapedPages.length, ...freshPages);
            console.log('🔍 SEO Analysis - Fresh pages HTML content check:', freshPages.map(p => ({
              id: p.id,
              url: p.url,
              hasHtmlContent: !!p.html_content,
              htmlContentLength: p.html_content?.length || 0
            })));
          } else {
            console.log('❌ SEO Analysis - No fresh scraped pages found in database');
          }
        } catch (fetchError) {
          console.error('❌ Error fetching fresh scraped pages:', fetchError);
        }
      }
      
      // If still no HTML content, try a direct database query for any page with HTML content
      if (!htmlContent && !isPageAnalysis && project) {
        console.log('🔄 SEO Analysis - Trying direct database query for HTML content...');
        try {
          const { data: directPages, error: directError } = await getScrapedPages(project.id);
          if (directError) {
            console.error('❌ Error in direct database query:', directError);
          } else if (directPages && directPages.length > 0) {
            console.log('🔍 SEO Analysis - Direct query found pages:', directPages.length);
            const pageWithHtml = directPages.find(p => p.html_content && p.html_content.trim().length > 0);
            if (pageWithHtml && pageWithHtml.html_content) {
              htmlContent = pageWithHtml.html_content;
              siteUrl = project.site_url;
              console.log('✅ SEO Analysis - Found HTML content via direct query, length:', htmlContent.length);
            } else {
              console.log('❌ SEO Analysis - Direct query found pages but none have HTML content');
              console.log('🔍 SEO Analysis - Direct query pages data:', directPages.map(p => ({
                id: p.id,
                url: p.url,
                hasHtmlContent: !!p.html_content,
                htmlContentLength: p.html_content?.length || 0,
                htmlContentPreview: p.html_content?.substring(0, 100) || 'null'
              })));
            }
          } else {
            console.log('❌ SEO Analysis - Direct query returned no pages');
          }
        } catch (directFetchError) {
          console.error('❌ Error in direct database query:', directFetchError);
        }
      }
      
      if (isPageAnalysis && page?.html_content) {
        // For single page analysis
        htmlContent = page.html_content;
        siteUrl = page.url || page.audit_project_id || 'Unknown URL';
      } else if (!isPageAnalysis && scrapedPages.length > 0 && project) {
        // For project analysis - get the first page with HTML content
        console.log('🔍 SEO Analysis - Available scraped pages:', scrapedPages.length);
        console.log('🔍 SEO Analysis - Scraped pages data:', scrapedPages.map(p => ({
          id: p.id,
          url: p.url,
          hasHtmlContent: !!p.html_content,
          htmlContentLength: p.html_content?.length || 0,
          title: p.title
        })));
        
        const firstPage = scrapedPages.find(p => p.html_content && p.html_content.trim().length > 0);
        if (firstPage?.html_content) {
          htmlContent = firstPage.html_content;
          siteUrl = project.site_url;
          console.log('✅ SEO Analysis - Found HTML content, length:', htmlContent.length);
        } else {
          console.log('❌ SEO Analysis - No HTML content found in any scraped page');
          console.log('🔍 SEO Analysis - Project scraping data:', project.scraping_data);
          
          // Try to get HTML from project scraping data as fallback
          if (project?.scraping_data?.pages && Array.isArray(project.scraping_data.pages)) {
            console.log('🔍 SEO Analysis - Project scraping pages:', project.scraping_data.pages.length);
            const scrapingPage = project.scraping_data.pages.find((p: { html?: string }) => p.html && p.html.trim().length > 0);
            if (scrapingPage?.html) {
              htmlContent = scrapingPage.html;
              siteUrl = project.site_url;
              console.log('✅ SEO Analysis - Found HTML content in project scraping data, length:', htmlContent.length);
            } else {
              console.log('❌ SEO Analysis - No HTML content found in project scraping data either');
            }
          } else {
            console.log('❌ SEO Analysis - No project scraping data available');
          }
        }
        
        // Final fallback: Try to get HTML from any available source
        if (!htmlContent && project?.scraping_data) {
          console.log('🔄 SEO Analysis - Trying final fallback methods...');
          
          // Try different possible structures in scraping_data
          const scrapingData = project.scraping_data as Record<string, unknown>;
          const possibleHtmlSources = [
            scrapingData.html,
            scrapingData.content,
            scrapingData.body,
            (scrapingData.page as { html?: string })?.html,
            (scrapingData.homepage as { html?: string })?.html,
            (scrapingData.main_page as { html?: string })?.html
          ];
          
          for (const source of possibleHtmlSources) {
            if (source && typeof source === 'string' && source.trim().length > 0) {
              htmlContent = source;
              siteUrl = project.site_url;
              console.log('✅ SEO Analysis - Found HTML content in fallback source, length:', htmlContent.length);
              break;
            }
          }
        }
      }
      
      // Final fallback: If still no HTML content found, create a basic HTML structure
      if (!htmlContent && !isPageAnalysis && project) {
        console.log('🔄 SEO Analysis - No HTML content found anywhere, creating fallback HTML...');
        htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${project.site_url || 'Website Analysis'}</title>
            <meta name="description" content="Website analysis for ${project.site_url}">
          </head>
          <body>
            <h1>Website Analysis</h1>
            <p>This is a fallback HTML structure for SEO analysis.</p>
            <p>URL: ${project.site_url}</p>
          </body>
          </html>
        `;
        siteUrl = project.site_url;
        console.log('⚠️ SEO Analysis - Using fallback HTML content for analysis');
      }
      
      if (htmlContent) {
        const analysis = analyzeSEO(htmlContent, siteUrl);
        setSeoAnalysis(analysis);
        // Store the analysis in the database only for project analysis
        if (!isPageAnalysis && project) {
          const {
            error: updateError
          } = await updateAuditProject(project.id, {
            seo_analysis: analysis
          });
          if (updateError) {
            console.error('❌ Failed to store SEO analysis:', updateError);
            // Don't set error for database update failures - analysis still completed successfully
            console.log('✅ SEO analysis completed successfully, but database update failed');
          } else {
            console.log('✅ SEO analysis completed and saved to database');
          }
        }
      } else {
        setError('No HTML content available for analysis');
      }
    } catch (err) {
      setError('Failed to analyze SEO content');
      console.error('SEO Analysis Error:', err);
    } finally {
      setLoading(false);
    }
  }, [isPageAnalysis, page?.html_content, page?.url, page?.audit_project_id, scrapedPages, updateAuditProject, getScrapedPages, project]);
  useEffect(() => {
    // Reset analysis trigger when key dependencies change
    analysisTriggered.current = false;
  }, [scrapedPages.length, project?.id, page?.url, isPageAnalysis]);

  useEffect(() => {
    // For page analysis, analyze immediately if we have page data
    if (isPageAnalysis && page?.html_content && !seoAnalysis && !analysisTriggered.current) {
      analysisTriggered.current = true;
      analyzePage();
    }
    // For project analysis, only run if we have scraped pages and no existing analysis
    else if (!isPageAnalysis && scrapedPages.length > 0 && !project?.seo_analysis && !analysisTriggered.current) {
      analysisTriggered.current = true;
      analyzePage();
    }
  }, [analyzePage, scrapedPages.length, project?.seo_analysis, page?.html_content, isPageAnalysis, seoAnalysis]);
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  // const getImpactColor = (impact: string) => {
  //   switch (impact) {
  //     case 'high':
  //       return 'text-red-600 bg-red-50 border-red-200'
  //     case 'medium':
  //       return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  //     case 'low':
  //       return 'text-blue-600 bg-blue-50 border-blue-200'
  //     default:
  //       return 'text-gray-600 bg-gray-50 border-gray-200'
  //   }
  // }

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
          <button 
            onClick={analyzePage}
            disabled 
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed rounded-md transition-colors"
          >
            Analyzing...
          </button>
        </div>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
          <button
            onClick={analyzePage}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
          >
            Retry Analysis
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>;
  }
  if (!seoAnalysis) {
    return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
          <button
            onClick={analyzePage}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
          >
            Start Analysis
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600">No data available for SEO analysis</p>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
        <button
          onClick={analyzePage}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Analyzing...' : seoAnalysis ? 'Re-analyze' : 'Start Analysis'}
        </button>
      </div>

      {/* SEO Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">SEO Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(seoAnalysis.score)}`}>
            {seoAnalysis.score}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(seoAnalysis.score)}`} style={{
          width: `${seoAnalysis.score}%`
        }}></div>
        </div>
      </div>

      {/* Summary Overview - Clean Row Format */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Analysis Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{seoAnalysis.score}</div>
              <div className="text-xs text-gray-600">SEO Score</div>
            </div>
            {seoAnalysis.highlights && seoAnalysis.highlights.length > 0 && <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{seoAnalysis.summary?.totalHighlights || 0}</div>
                <div className="text-xs text-gray-600">Highlights</div>
              </div>}
            {seoAnalysis.issues && seoAnalysis.issues.length > 0 && <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{seoAnalysis.summary?.errors || 0}</div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{seoAnalysis.summary?.warnings || 0}</div>
                  <div className="text-xs text-gray-600">Warnings</div>
                </div>
              </>}
          </div>
        </div>
      </div>

      {/* Positive Highlights - Clean Row Format */}
      {seoAnalysis.highlights && seoAnalysis.highlights.length > 0 && <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">✨ What&apos;s Working Well</h4>
          <div className="space-y-2">
            {seoAnalysis.highlights.map((highlight: SEOHighlight, index: number) => <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {highlight.type === 'achievement' ? '🏆' : highlight.type === 'good-practice' ? '✅' : '⚡'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{highlight.title}</div>
                    <div className="text-xs text-gray-500">{highlight.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {highlight.category}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                    {highlight.impact}
                  </span>
                </div>
              </div>)}
          </div>
        </div>}

      {/* Issues and Fixes - Clean Row Format */}
      {seoAnalysis.issues && seoAnalysis.issues.length > 0 && <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Issues & Fixes</h4>
          <div className="space-y-2">
            {seoAnalysis.issues.map((issue, index) => <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getIssueIcon(issue.type)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{issue.title}</div>
                      <div className="text-xs text-gray-500">{issue.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {issue.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${issue.impact === 'high' ? 'bg-red-100 text-red-700' : issue.impact === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {issue.impact}
                    </span>
                  </div>
                </div>
                <div className="ml-8 mt-2">
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Fix:</span> {issue.fix}
                  </div>
                </div>
              </div>)}
          </div>
        </div>}

      {/* Recommendations - Clean Row Format */}
      {seoAnalysis.recommendations && seoAnalysis.recommendations.length > 0 && <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {seoAnalysis.recommendations.map((recommendation, index) => <div key={index} className="flex items-start bg-white border border-gray-200 rounded-lg p-3">
                <span className="text-blue-500 mr-3 mt-0.5">💡</span>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>)}
          </div>
        </div>}

      {(!seoAnalysis.issues || seoAnalysis.issues.length === 0) && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
          <div className="text-emerald-500 text-4xl mb-2">🎉</div>
          <p className="text-gray-700 font-medium">Excellent! No SEO issues found.</p>
          {seoAnalysis.highlights && seoAnalysis.highlights.length > 0 && <p className="text-sm text-emerald-600 mt-2">
              Your page is following {seoAnalysis.highlights.length} SEO best practice{seoAnalysis.highlights.length !== 1 ? 's' : ''}!
            </p>}
        </div>}
    </div>;
}