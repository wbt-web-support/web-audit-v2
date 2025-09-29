'use client';

import { SEOAnalysisResult, SEOHighlight } from '@/types/audit';
import { analyzeSEO } from '@/lib/seo-analysis';
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
interface Project {
  id: string;
  site_url: string;
  scraping_data?: Record<string, unknown>;
  seo_analysis?: SEOAnalysisResult | null;
}
interface ScrapedPage {
  html_content?: string | null;
  url?: string;
  audit_project_id?: string;
  performance_analysis?: Record<string, unknown>;
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
  const {
    updateAuditProject
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
      if (isPageAnalysis && page?.html_content) {
        // For single page analysis
        htmlContent = page.html_content;
        siteUrl = page.url || page.audit_project_id || 'Unknown URL';
      } else if (!isPageAnalysis && scrapedPages.length > 0 && project) {
        // For project analysis
        const firstPage = scrapedPages.find(p => p.audit_project_id === project.id);
        if (firstPage?.html_content) {
          htmlContent = firstPage.html_content;
          siteUrl = project.site_url;
        }
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
            setError('Analysis completed but failed to save to database');
          } else {}
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
  }, [isPageAnalysis, page, scrapedPages, project, updateAuditProject]);
  useEffect(() => {
    // For page analysis, analyze immediately if we have page data
    if (isPageAnalysis && page?.html_content && !seoAnalysis) {
      analyzePage();
    }
    // For project analysis, only run if we have scraped pages and no existing analysis
    else if (!isPageAnalysis && scrapedPages.length > 0 && !project?.seo_analysis) {
      analyzePage();
    }
  }, [scrapedPages, project?.seo_analysis, page, isPageAnalysis, seoAnalysis, analyzePage]);
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
          <button disabled className="px-3 py-1 text-sm bg-gray-100 text-gray-400 cursor-not-allowed rounded-md">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analysis</h3>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>;
  }
  if (!seoAnalysis) {
    return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Analysis</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <p className="text-gray-600">No data available for SEO analysis</p>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
       
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