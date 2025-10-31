'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { filterHtmlContent } from "@/lib/html-content-filter";
import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useSupabase } from "@/contexts/SupabaseContext";
import SkeletonLoader from "@/app/dashboard/components/SkeletonLoader";
import { featureCache, createCacheKey } from "@/lib/feature-cache";

// Define interfaces
interface BrandConsistencyData {
  companyName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  additionalInformation: string;
}

interface ScrapedPageData {
  id: string;
  url: string;
  html_content: string | null;
  filtered_content?: string | null;
  audit_project_id?: string;
}

interface BrandConsistencyTabProps {
  page: ScrapedPageData;
  projectBrandData?: BrandConsistencyData | null;
  onBrandDataUpdate?: (newBrandData: BrandConsistencyData) => void;
}

interface ConsistencyIssue {
  type: 'company_name' | 'phone_number' | 'email_address' | 'address' | 'additional_info';
  severity: 'high' | 'medium' | 'low';
  found: string;
  expected: string;
  description: string;
  suggestion: string;
  position?: number;
}

export default function BrandConsistencyTab({
  page,
  projectBrandData,
  onBrandDataUpdate
}: BrandConsistencyTabProps) {
  const [brandData, setBrandData] = useState<BrandConsistencyData | null>(projectBrandData || null);
  const [analysisResults, setAnalysisResults] = useState<ConsistencyIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { user } = useAuth();
  const { hasFeature, loading: planLoading } = useUserPlan();
  const { updateAuditProject, getAuditProject } = useSupabase();

  // Check if user has access to brand consistency analysis with caching
  const hasFeatureAccess = useMemo(() => {
    const cacheKey = createCacheKey('brand_consistency_check', user?.id);
    
    // Return cached result if available
    const cachedResult = featureCache.get(cacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // If still loading, return null to show skeleton
    if (planLoading) {
      return null;
    }
    
    // Get fresh result and cache it
    const result = hasFeature('brand_consistency_check');
    featureCache.set(cacheKey, result);
    return result;
  }, [hasFeature, user?.id, planLoading]);

  // Update checking access state when feature access is determined
  useEffect(() => {
    if (hasFeatureAccess !== null) {
      setIsCheckingAccess(false);
    }
  }, [hasFeatureAccess]);

  // Clean up expired cache entries on mount
  useEffect(() => {
    featureCache.clearExpired();
  }, []);

  // Use filtered content if available, otherwise filter HTML content
  const filteredContent = page?.filtered_content || filterHtmlContent(page?.html_content || '');
  const textContent = typeof filteredContent === 'string' ? filteredContent : filteredContent?.pureContent || '';

  // Function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text.toLowerCase()
      .replace(/[^\w\s@.-]/g, '') // Remove special characters except @, ., -
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  // Function to check phone number consistency
  const checkPhoneNumber = (content: string, expectedPhone: string): ConsistencyIssue[] => {
    const issues: ConsistencyIssue[] = [];
    if (!expectedPhone.trim()) return issues;

    const normalizedExpected = normalizeText(expectedPhone);
    const phoneRegex = /(\+?[\d\s\-\(\)]{7,})/g;
    const foundPhones = content.match(phoneRegex) || [];

    if (foundPhones.length === 0) {
      issues.push({
        type: 'phone_number',
        severity: 'high',
        found: 'No phone number found',
        expected: expectedPhone,
        description: 'Expected phone number not found in content',
        suggestion: `Add the phone number "${expectedPhone}" to your content`
      });
    } else {
      const normalizedFound = foundPhones.map(phone => normalizeText(phone));
      const hasMatch = normalizedFound.some(phone => 
        phone.includes(normalizedExpected) || normalizedExpected.includes(phone)
      );

      if (!hasMatch) {
        issues.push({
          type: 'phone_number',
          severity: 'medium',
          found: foundPhones.join(', '),
          expected: expectedPhone,
          description: 'Found phone numbers but none match the expected brand phone number',
          suggestion: `Update phone numbers to match "${expectedPhone}" or verify the correct number`
        });
      }
    }

    return issues;
  };

  // Function to check email consistency
  const checkEmailAddress = (content: string, expectedEmail: string): ConsistencyIssue[] => {
    const issues: ConsistencyIssue[] = [];
    if (!expectedEmail.trim()) return issues;

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const foundEmails = content.match(emailRegex) || [];

    if (foundEmails.length === 0) {
      issues.push({
        type: 'email_address',
        severity: 'high',
        found: 'No email address found',
        expected: expectedEmail,
        description: 'Expected email address not found in content',
        suggestion: `Add the email address "${expectedEmail}" to your content`
      });
    } else {
      const hasMatch = foundEmails.some(email => 
        email.toLowerCase() === expectedEmail.toLowerCase()
      );

      if (!hasMatch) {
        issues.push({
          type: 'email_address',
          severity: 'medium',
          found: foundEmails.join(', '),
          expected: expectedEmail,
          description: 'Found email addresses but none match the expected brand email',
          suggestion: `Update email addresses to match "${expectedEmail}" or verify the correct email`
        });
      }
    }

    return issues;
  };

  // Function to check company name consistency
  const checkCompanyName = (content: string, expectedName: string): ConsistencyIssue[] => {
    const issues: ConsistencyIssue[] = [];
    if (!expectedName.trim()) return issues;

    const normalizedExpected = normalizeText(expectedName);
    const words = normalizedExpected.split(' ');
    
    // Look for company name variations
    const nameRegex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
    const matches = content.match(nameRegex);

    if (!matches || matches.length === 0) {
      issues.push({
        type: 'company_name',
        severity: 'high',
        found: 'Company name not found',
        expected: expectedName,
        description: 'Expected company name not found in content',
        suggestion: `Add the company name "${expectedName}" to your content`
      });
    } else if (matches.length < 2) {
      issues.push({
        type: 'company_name',
        severity: 'low',
        found: matches.join(', '),
        expected: expectedName,
        description: 'Company name found but may need more prominence',
        suggestion: `Consider mentioning "${expectedName}" more prominently in your content`
      });
    }

    return issues;
  };

  // Function to check address consistency
  const checkAddress = (content: string, expectedAddress: string): ConsistencyIssue[] => {
    const issues: ConsistencyIssue[] = [];
    if (!expectedAddress.trim()) return issues;

    const normalizedExpected = normalizeText(expectedAddress);
    const addressWords = normalizedExpected.split(' ').filter(word => word.length > 2);
    
    // Look for address components
    const addressRegex = new RegExp(`\\b(${addressWords.join('|')})\\b`, 'gi');
    const matches = content.match(addressRegex);

    if (!matches || matches.length === 0) {
      issues.push({
        type: 'address',
        severity: 'medium',
        found: 'Address not found',
        expected: expectedAddress,
        description: 'Expected address not found in content',
        suggestion: `Add the address "${expectedAddress}" to your content`
      });
    } else if (matches.length < addressWords.length / 2) {
      issues.push({
        type: 'address',
        severity: 'low',
        found: matches.join(', '),
        expected: expectedAddress,
        description: 'Partial address information found',
        suggestion: `Consider adding the complete address "${expectedAddress}"`
      });
    }

    return issues;
  };

  // Function to check additional information consistency
  const checkAdditionalInfo = (content: string, expectedInfo: string): ConsistencyIssue[] => {
    const issues: ConsistencyIssue[] = [];
    if (!expectedInfo.trim()) return issues;

    const normalizedExpected = normalizeText(expectedInfo);
    const words = normalizedExpected.split(' ').filter(word => word.length > 3);
    
    if (words.length > 0) {
      const infoRegex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
      const matches = content.match(infoRegex);

      if (!matches || matches.length === 0) {
        issues.push({
          type: 'additional_info',
          severity: 'low',
          found: 'Additional information not found',
          expected: expectedInfo,
          description: 'Expected additional information not found in content',
          suggestion: `Consider adding information about "${expectedInfo}"`
        });
      }
    }

    return issues;
  };

  // Main analysis function
  const analyzeBrandConsistency = useCallback(async (customBrandData?: BrandConsistencyData) => {
    const dataToAnalyze = customBrandData || brandData;
    
    if (!dataToAnalyze || !textContent) {
      setAnalysisError('No brand data or content available for analysis');
      return;
    }

    console.log('Analyzing with brand data:', dataToAnalyze);
    console.log('Content to analyze:', textContent.substring(0, 100) + '...');

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const issues: ConsistencyIssue[] = [];

      // Check each brand data field
      issues.push(...checkCompanyName(textContent, dataToAnalyze.companyName));
      issues.push(...checkPhoneNumber(textContent, dataToAnalyze.phoneNumber));
      issues.push(...checkEmailAddress(textContent, dataToAnalyze.emailAddress));
      issues.push(...checkAddress(textContent, dataToAnalyze.address));
      issues.push(...checkAdditionalInfo(textContent, dataToAnalyze.additionalInformation));

      console.log('Analysis completed with', issues.length, 'issues found');
      setAnalysisResults(issues);
    } catch (error) {
      console.error('Error during brand consistency analysis:', error);
      setAnalysisError('Failed to analyze brand consistency. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [brandData, textContent, checkCompanyName, checkPhoneNumber, checkEmailAddress, checkAddress, checkAdditionalInfo]);

  // Sync brandData with projectBrandData when it changes
  useEffect(() => {
    if (projectBrandData && projectBrandData !== brandData) {
      console.log('Brand data updated from props:', projectBrandData);
      setBrandData(projectBrandData);
    }
  }, [projectBrandData, brandData]);

  // Log when brandData changes
  useEffect(() => {
    console.log('Brand data state changed:', brandData);
  }, [brandData]);

  // Auto-analyze when component mounts or data changes
  useEffect(() => {
    if (brandData && textContent && !analysisResults.length) {
      analyzeBrandConsistency();
    }
  }, [brandData, textContent, analyzeBrandConsistency, analysisResults.length]);

  // Function to handle saving brand data
  const handleSaveBrandData = async (updatedBrandData: BrandConsistencyData) => {
    setIsSaving(true);
    try {
      if (!page.audit_project_id) {
        throw new Error('Project ID is missing');
      }

      console.log('Step 1: Starting to save brand data...', updatedBrandData);

      // Step 1: Save to database using Supabase
      const { data, error } = await updateAuditProject(page.audit_project_id, {
        brand_data: updatedBrandData
      });

      if (error) {
        throw new Error(error.message || 'Failed to save brand data');
      }

      console.log('Step 2: Brand data saved successfully to database:', data);
      
      // Step 2: Fetch updated project data from database
      console.log('Step 3: Fetching updated project data from database...');
      const { data: updatedProject, error: fetchError } = await getAuditProject(page.audit_project_id);
      
      if (fetchError) {
        console.warn('Step 3 Warning: Could not fetch updated project data:', fetchError);
        // Continue with local state update as fallback
        setBrandData(updatedBrandData);
      } else if (updatedProject?.brand_data) {
        console.log('Step 3 Success: Fetched updated brand data from database:', updatedProject.brand_data);
        setBrandData(updatedProject.brand_data);
      } else {
        console.log('Step 3 Fallback: Using local brand data');
        setBrandData(updatedBrandData);
      }
      
      // Step 3: Close modal
      setIsEditModalOpen(false);
      console.log('Step 4: Modal closed');
      
      // Step 4: Force refresh by updating refresh key
      setRefreshKey(prev => prev + 1);
      console.log('Step 5: Refresh key updated to force re-render');
      
      // Step 5: Notify parent component about the update
      if (onBrandDataUpdate) {
        const finalBrandData = updatedProject?.brand_data || updatedBrandData;
        onBrandDataUpdate(finalBrandData);
        console.log('Step 6: Parent component notified of brand data update');
      }
      
      // Step 6: Clear previous analysis results to trigger re-analysis
      setAnalysisResults([]);
      console.log('Step 7: Previous analysis results cleared');
      
      // Step 7: Wait for state to update, then re-analyze with new data
      setTimeout(() => {
        console.log('Step 8: Starting re-analysis with updated brand data...');
        console.log('Step 8: Current brand data state:', brandData);
        console.log('Step 8: Updated brand data that should be used:', updatedProject?.brand_data || updatedBrandData);
        
        // Force re-analysis with the latest brand data
        if (updatedProject?.brand_data || updatedBrandData) {
          const latestBrandData = updatedProject?.brand_data || updatedBrandData;
          console.log('Step 8: Using latest brand data for analysis:', latestBrandData);
          
          // Run analysis directly with the latest brand data
          analyzeBrandConsistency(latestBrandData);
        } else {
          console.warn('Step 8: No brand data available for analysis');
        }
      }, 300);
      
    } catch (error) {
      console.error('Error saving brand data:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to save brand data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show skeleton loading while checking feature access
  if (isCheckingAccess || hasFeatureAccess === null) {
    return <SkeletonLoader type="grammar" />;
  }

  // Show upgrade card if user doesn't have access to brand consistency analysis
  if (hasFeatureAccess === false) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="text-blue-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Brand Consistency Analysis</h3>
            <p className="text-sm text-gray-600 mb-3">
              This feature is not available in your current plan. Upgrade to access brand consistency analysis.
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Current plan: <span className="font-medium">Check your plan settings</span>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard?tab=profile&subtab=plans'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if page data is incomplete
  if (!page) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No page data available for analysis.</p>
      </div>
    );
  }

  if (!textContent || textContent.trim().length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No content available for analysis.</p>
      </div>
    );
  }

  if (!brandData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No brand data available for consistency analysis.</p>
        <p className="text-sm text-gray-400 mt-2">Brand consistency data is required to perform this analysis.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
          <p className="text-xs text-gray-600 mb-2">Debug Info:</p>
          <p className="text-xs text-gray-500">Project Brand Data: {JSON.stringify(projectBrandData, null, 2)}</p>
        </div>
        
        {/* Temporary test button - remove this later */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">Test: Add sample brand data</p>
          <button 
            onClick={() => {
              const testBrandData = {
                companyName: 'Test Company',
                phoneNumber: '+1-555-123-4567',
                emailAddress: 'contact@testcompany.com',
                address: '123 Test Street, Test City, TC 12345',
                additionalInformation: 'We are a test company for demonstration purposes'
              };
              setBrandData(testBrandData);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Test Brand Data
          </button>
        </div>
      </div>
    );
  }

  // Group issues by type
  const groupedIssues = analysisResults.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = [];
    }
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, ConsistencyIssue[]>);

  const issueTypes = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'email_address', label: 'Email Address' },
    { key: 'address', label: 'Address' },
    { key: 'additional_info', label: 'Additional Info' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Brand Consistency Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">
              Checking content against brand guidelines
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Brand Data
            </button>
            {/* <button 
              onClick={analyzeBrandConsistency} 
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isAnalyzing ? 'Analyzing...' : ''}
            </button> */}
          </div>
        </div>

        {analysisError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{analysisError}</p>
          </div>
        )}

        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Analyzing Brand Consistency...
                </h4>
                <p className="text-gray-600">Checking content against your brand guidelines...</p>
              </div>
            </div>
          </div>
        ) : analysisResults.length > 0 ? (
          <>
            {/* Brand Data Summary */}
            <div key={`brand-guidelines-${refreshKey}`} className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Brand Guidelines</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {brandData?.companyName && (
                  <div>
                    <span className="font-medium text-gray-700">Company:</span>
                    <span className="ml-2 text-gray-600">{brandData.companyName}</span>
                  </div>
                )}
                {brandData?.phoneNumber && (
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-600">{brandData.phoneNumber}</span>
                  </div>
                )}
                {brandData?.emailAddress && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{brandData.emailAddress}</span>
                  </div>
                )}
                {brandData?.address && (
                  <div>
                    <span className="font-medium text-gray-700">Address:</span>
                    <span className="ml-2 text-gray-600">{brandData.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Issues by Type */}
            <div className="space-y-6">
              {issueTypes.map(type => {
                const issues = groupedIssues[type.key] || [];
                if (issues.length === 0) return null;

                return (
                  <div key={type.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="font-medium text-gray-900">{type.label}</h4>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {issues.length} issue{issues.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {issues.map((issue, index) => (
                        <div 
                          key={index} 
                          className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {issue.severity.toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {type.label}
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Found:</span>
                                  <span className="ml-2 text-gray-600">{issue.found}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Expected:</span>
                                  <span className="ml-2 text-gray-600">{issue.expected}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Description:</span>
                                  <span className="ml-2 text-gray-600">{issue.description}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Suggestion:</span>
                                  <span className="ml-2 text-gray-600">{issue.suggestion}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-green-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No brand consistency issues found</p>
            <p className="text-sm text-gray-500">Your content appears to be consistent with your brand guidelines</p>
          </div>
        )}
      </div>

      {/* Edit Brand Data Modal */}
      {isEditModalOpen && (
        <EditBrandDataModal
          brandData={brandData}
          onSave={handleSaveBrandData}
          onClose={() => setIsEditModalOpen(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

// Edit Brand Data Modal Component
interface EditBrandDataModalProps {
  brandData: BrandConsistencyData | null;
  onSave: (data: BrandConsistencyData) => void;
  onClose: () => void;
  isSaving: boolean;
}

function EditBrandDataModal({ brandData, onSave, onClose, isSaving }: EditBrandDataModalProps) {
  const [formData, setFormData] = useState<BrandConsistencyData>({
    companyName: brandData?.companyName || '',
    phoneNumber: brandData?.phoneNumber || '',
    emailAddress: brandData?.emailAddress || '',
    address: brandData?.address || '',
    additionalInformation: brandData?.additionalInformation || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof BrandConsistencyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Brand Data</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.emailAddress}
              onChange={(e) => handleChange('emailAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information
            </label>
            <textarea
              value={formData.additionalInformation}
              onChange={(e) => handleChange('additionalInformation', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter additional information"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save & Re-analyze'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
