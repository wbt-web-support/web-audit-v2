"use client";

import { AuditProject } from "@/types/audit";
import SEOAnalysisSection from "./SEOAnalysisSection";
import DynamicImage from "./DynamicImage";
import FaviconDisplay from "../FaviconDisplay";

interface OverviewSectionProps {
  project: AuditProject;
  scrapedPages?: Array<{
    id: string;
    url: string;
    title: string | null;
    status_code: number | null;
    created_at: string;
    links_count: number;
    images_count: number;
    meta_tags_count: number;
    html_content: string | null;
    audit_project_id: string;
  }>;
}

export default function OverviewSection({ project, scrapedPages = [] }: OverviewSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-blue-200 text-blue-900";
      case "pending":
        return "bg-blue-50 text-blue-700";
      case "failed":
        return "bg-blue-300 text-blue-900";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Stats */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Content Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {project.total_pages || 0}
              </div>
              <div className="text-sm text-gray-600">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {project.total_links || 0}
              </div>
              <div className="text-sm text-gray-600">Links</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {project.total_images || 0}
              </div>
              <div className="text-sm text-gray-600">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {project.total_meta_tags || 0}
              </div>
              <div className="text-sm text-gray-600">Meta Tags</div>
            </div>
          </div>
        </div>
        {/* SEO Analysis Section */}
        <div className="lg:col-span-3">
          <SEOAnalysisSection 
            project={project} 
            scrapedPages={scrapedPages}
            dataVersion={Date.now()}
          />
        </div>
        {/* Technologies Overview */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="bg-white rounded-lg  border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Technical Detected
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {project.technologies
                .slice(0, 6)
                .map((tech: { name: string; version?: string; category?: string; confidence?: number; icon?: string }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      {tech.icon && (
                        <DynamicImage
                          src={tech.icon}
                          alt={tech.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 mr-2 rounded"
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        {tech.name}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (tech.confidence || 0) >= 0.8
                          ? "bg-blue-100 text-blue-800"
                          : (tech.confidence || 0) >= 0.5
                          ? "bg-blue-200 text-blue-900"
                          : "bg-blue-300 text-blue-900"
                      }`}
                    >
                      {Math.round((tech.confidence || 0) * 100)}%
                    </span>
                  </div>
                ))}
            </div>
            {project.technologies.length > 6 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                +{project.technologies.length - 6} more technologies
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Stats */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg  border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Info
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Site Favicon</span>
              <FaviconDisplay 
                data={project} 
                size="sm"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {getStatusDisplayName(project.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="text-gray-900">
                {formatDate(project.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-900">
                {formatDate(project.updated_at)} 
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">{project.progress}%</span>
            </div>
          </div>
        </div>

        {/* CMS Info */}
        {project.cms_detected && (
          <div className="bg-white rounded-lg  border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              CMS Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="text-gray-900">
                  {project.cms_type || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version</span>
                <span className="text-gray-900">
                  {project.cms_version || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence</span>
                <span className="text-gray-900">
                  {Math.round((project.cms_confidence || 0) * 100)}%
                </span>
              </div>
              {project.cms_plugins && project.cms_plugins.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Plugins</span>
                  <span className="text-gray-900">
                    {project.cms_plugins.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pages List */}
        {scrapedPages && scrapedPages.length > 0 && (
          <div className="bg-white rounded-lg  border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pages List
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scrapedPages.slice(0, 10).map((page, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                      {page.title || 'Untitled'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      page.status_code && page.status_code >= 200 && page.status_code < 300 ? 'bg-blue-100 text-blue-800' :
                      page.status_code && page.status_code >= 300 && page.status_code < 400 ? 'bg-blue-200 text-blue-900' :
                      'bg-blue-300 text-blue-900'
                    }`}>
                      {page.status_code || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 truncate">{page.url}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{page.links_count || 0} links</span>
                    <span>{page.images_count || 0} images</span>
                    <span>{page.meta_tags_count || 0} meta tags</span>
                  </div>
                </div>
              ))}
              {scrapedPages.length > 10 && (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500">
                    +{scrapedPages.length - 10} more pages
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
