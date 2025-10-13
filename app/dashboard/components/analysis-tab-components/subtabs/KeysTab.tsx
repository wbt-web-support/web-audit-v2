'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuditProject } from '@/types/audit';
import { useSupabase } from '@/contexts/SupabaseContext';
import { DetectedKey } from '@/lib/key-detection';

interface KeysTabProps {
  project: AuditProject;
}

interface KeysData {
  keys: DetectedKey[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    status: string;
    severity: string;
  };
  summary: {
    totalKeys: number;
    exposedKeys: number;
    secureKeys: number;
    criticalKeys: number;
    highRiskKeys: number;
    analysisComplete: boolean;
    processingTime: number;
  };
}

export default function KeysTab({
  project
}: KeysTabProps) {
  const { getDetectedKeys } = useSupabase();
  const [keysData, setKeysData] = useState<KeysData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Load keys data from database with pagination and filtering
  const loadKeysData = useCallback(async (page = 1, limit = 20, status = 'all', severity = 'all') => {
    if (!project?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await getDetectedKeys(project.id, page, limit, status, severity);
      
      if (error) {
        console.error('Error loading keys data:', error);
        setError(`Failed to load keys data: ${error.message || 'Unknown error'}`);
        return;
      }
      
      if (data) {
        console.log('🔑 Loaded keys data from database:', data);
        setKeysData(data);
      }
    } catch (err) {
      console.error('Unexpected error loading keys data:', err);
      setError('Unexpected error occurred while loading keys data');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id, getDetectedKeys]);

  // Load data when component mounts or project changes
  useEffect(() => {
    if (project?.id) {
      setCurrentPage(1);
      setStatusFilter('all');
      setSeverityFilter('all');
      loadKeysData(1, itemsPerPage, 'all', 'all');
    }
  }, [project?.id, loadKeysData, itemsPerPage]);

  // Load data when page, items per page, or filters change
  useEffect(() => {
    if (project?.id) {
      loadKeysData(currentPage, itemsPerPage, statusFilter, severityFilter);
    }
  }, [currentPage, itemsPerPage, statusFilter, severityFilter, loadKeysData, project?.id]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (project?.id && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, severityFilter, project?.id, currentPage]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-blue-300 text-blue-900 border-blue-300';
      case 'high':
        return 'bg-blue-200 text-blue-900 border-blue-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-100';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-50';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-100';
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex items-center justify-center">
            <span className="text-sm">⚠</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Keys Analysis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This analysis checks for exposed API keys, secrets, and sensitive credentials in your website.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Loading keys data...</span>
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex items-center justify-center">
                <span className="text-sm">❌</span>
              </div>
              <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {!isLoading && !error && keysData && (
        <>
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-800">Analysis Summary</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Found {keysData.summary.totalKeys} keys across {project.total_pages || 0} pages
                </p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-blue-600 font-medium">
                  {keysData.summary.exposedKeys} Exposed
                </span>
                <span className="text-blue-500 font-medium">
                  {keysData.summary.secureKeys} Secure
                </span>
                <span className="text-blue-400 font-medium">
                  {keysData.summary.criticalKeys} Critical
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-3 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="exposed">Exposed</option>
                  <option value="secure">Secure</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Severity:</label>
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-3 py-1"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSeverityFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Keys List */}
          {keysData.keys.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-700">
                  Detected Keys ({keysData.total} total, showing {keysData.keys.length})
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Items per page:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {keysData.keys.map((key, index) => (
                  <div key={key.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover: ">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="text-sm font-medium text-gray-900">{key.type}</h5>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(key.severity)}`}>
                            {key.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            key.status === 'exposed' ? 'bg-blue-300 text-blue-900' : 
                            key.status === 'secure' ? 'bg-blue-100 text-blue-800' : 
                            'bg-blue-200 text-blue-900'
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Key:</span> {key.key}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {key.location}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Description:</span> {key.description}
                          </p>
                          {key.context && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Context:</span> {key.context}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Pattern: {key.pattern}</span>
                            <span>Confidence: {key.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {keysData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, keysData.total)} of {keysData.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {keysData.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(keysData.totalPages, prev + 1))}
                      disabled={currentPage === keysData.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="w-12 h-12 mx-auto mb-4 text-gray-300 flex items-center justify-center">
                  <span className="text-3xl">🔒</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Keys Detected</h4>
                <p className="text-gray-600">No security keys or credentials were found in the analyzed pages.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}