'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AuditProject } from '@/types/audit';
import EditProjectForm from '../forms/EditProjectForm';

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

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AuditProject | null;
  onSave: (projectId: string, data: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: BrandConsistencyData;
    hiddenUrlsList: HiddenUrl[];
  }) => void;
  onDelete: (projectId: string) => void;
  isSubmitting: boolean;
}

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
  onDelete,
  isSubmitting
}: EditProjectModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFormSubmit = (formData: {
    siteUrl: string;
    pageType: 'single' | 'multiple';
    brandConsistency: boolean;
    hiddenUrls: boolean;
    keysCheck: boolean;
    brandData: BrandConsistencyData;
    hiddenUrlsList: HiddenUrl[];
  }) => {
    console.log('EditProjectModal: Form submitted with data:', formData);
    if (project) {
      console.log('EditProjectModal: Calling onSave for project:', project.id);
      onSave(project.id, formData);
    } else {
      console.log('EditProjectModal: No project found');
    }
  };


  const handleDelete = () => {
    if (project) {
      onDelete(project.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-lg  max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black">Edit Project</h2>
                  <p className="text-gray-600 text-sm">Update project settings and configuration</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* EditProjectForm */}
            <div className="p-0">
              <EditProjectForm
                project={project}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                submitStatus={isSubmitting ? 'submitting' : 'idle'}
              />
            </div>

        
          </motion.div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-lg  max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-black">Delete Project</h3>
                        <p className="text-sm text-gray-600">This action cannot be undone.</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-6">
                      Are you sure you want to delete this project? All associated data will be permanently removed.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer"
                      >
                        Delete Project
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
