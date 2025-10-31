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
      type ProjectExtras = {
        page_type?: 'single' | 'multiple';
        brand_consistency?: boolean;
        hidden_urls?: boolean;
        keys_check?: boolean;
        brand_data?: BrandConsistencyData;
        hidden_urls_data?: HiddenUrl[];
      };
      const p = project as AuditProject & ProjectExtras;
      setFormData({
        siteUrl: project.site_url || '',
        pageType: p.page_type || 'single',
        brandConsistency: p.brand_consistency || false,
        hiddenUrls: p.hidden_urls || false,
        keysCheck: p.keys_check || false,
        brandData: p.brand_data || {
          companyName: '',
          phoneNumber: '',
          emailAddress: '',
          address: '',
          additionalInformation: ''
        },
        hiddenUrlsList: p.hidden_urls_data || [{ id: '1', url: '' }]
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
