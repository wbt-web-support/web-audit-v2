'use client';

import { useState, useEffect } from 'react';
import SiteCrawlForm from '../dashboard-components/SiteCrawlForm';
import { AuditProject } from '@/types/audit';

interface BrandConsistencyData {
  companyName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  additionalInformation: string;
}

interface HiddenUrl {
  id: string;
  url: string;
}

interface EditProjectFormProps {
  project: AuditProject | null;
  onSubmit: (formData: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: BrandConsistencyData;
    hiddenUrlsList: HiddenUrl[];
  }) => void;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'submitting' | 'success' | 'error';
}

export default function EditProjectForm({
  project,
  onSubmit,
  isSubmitting,
  submitStatus
}: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    siteUrl: '',
    pageType: 'single' as 'single' | 'multiple',
    brandConsistency: false,
    hiddenUrls: false,
    keysCheck: false,
    brandData: {
      companyName: '',
      phoneNumber: '',
      emailAddress: '',
      address: '',
      additionalInformation: ''
    } as BrandConsistencyData,
    hiddenUrlsList: [{ id: '1', url: '' }] as HiddenUrl[]
  });

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        siteUrl: project.site_url || '',
        pageType: 'single', // Default to single page
        brandConsistency: false, // These fields don't exist in current AuditProject type
        hiddenUrls: false,
        keysCheck: false,
        brandData: {
          companyName: '',
          phoneNumber: '',
          emailAddress: '',
          address: '',
          additionalInformation: ''
        },
        hiddenUrlsList: [{ id: '1', url: '' }]
      });
    }
  }, [project]);

  const handleFormSubmit = (data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: BrandConsistencyData;
    hiddenUrlsList: HiddenUrl[];
  }) => {
    onSubmit(data);
  };

  return (
    <SiteCrawlForm
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitStatus={submitStatus}
      isEditMode={true}
      initialData={formData}
    />
  );
}
