'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  label: string;
  sort_order: number;
  is_active: boolean;
  pricePerCredit: number;
}

interface CreditPackageForm {
  credits: string;
  price: string;
  label: string;
  sort_order: number;
}

export default function CreditPackagesManagement() {
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loadingCreditPackages, setLoadingCreditPackages] = useState(false);
  const [showCreditPackageForm, setShowCreditPackageForm] = useState(false);
  const [editingCreditPackage, setEditingCreditPackage] = useState<CreditPackage | null>(null);
  const [creditPackageForm, setCreditPackageForm] = useState<CreditPackageForm>({
    credits: '',
    price: '',
    label: '',
    sort_order: 0
  });

  // Load credit packages
  const loadCreditPackages = useCallback(async () => {
    setLoadingCreditPackages(true);
    try {
      const response = await fetch('/api/credit-packages');
      if (response.ok) {
        const data = await response.json();
        setCreditPackages(data.packages || []);
      } else {
        console.error('Failed to load credit packages');
      }
    } catch (error) {
      console.error('Error loading credit packages:', error);
    } finally {
      setLoadingCreditPackages(false);
    }
  }, []);

  // Load credit packages on component mount
  useEffect(() => {
    loadCreditPackages();
  }, [loadCreditPackages]);

  // Handle credit package actions (create, update, delete)
  const handleCreditPackageAction = async (
    packageId: string | null,
    action: 'create' | 'update' | 'delete',
    data?: Partial<CreditPackage>
  ) => {
    try {
      if (action === 'delete' && packageId) {
        const response = await fetch(`/api/credit-packages/${packageId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Failed to delete package: ${errorData.error || 'Unknown error'}`);
          return;
        }
      } else if (action === 'create' && data) {
        const response = await fetch('/api/credit-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Failed to create package: ${errorData.error || 'Unknown error'}`);
          return;
        }
      } else if (action === 'update' && packageId && data) {
        const response = await fetch(`/api/credit-packages/${packageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Failed to update package: ${errorData.error || 'Unknown error'}`);
          return;
        }
      }

      // Reload packages after successful action
      await loadCreditPackages();
      setShowCreditPackageForm(false);
      setEditingCreditPackage(null);
      setCreditPackageForm({ credits: '', price: '', label: '', sort_order: 0 });
      // Trigger refresh in billing section
      window.dispatchEvent(new CustomEvent('billingRefresh'));
    } catch (error) {
      console.error('Error performing credit package action:', error);
      alert('An error occurred while processing the request');
    }
  };

  // Handle edit credit package
  const handleEditCreditPackage = (pkg: CreditPackage) => {
    setEditingCreditPackage(pkg);
    setCreditPackageForm({
      credits: pkg.credits.toString(),
      price: pkg.price.toString(),
      label: pkg.label,
      sort_order: pkg.sort_order || 0
    });
    setShowCreditPackageForm(true);
  };

  // Handle submit credit package form
  const handleSubmitCreditPackage = () => {
    if (!creditPackageForm.credits || !creditPackageForm.price || !creditPackageForm.label) {
      alert('Please fill in all required fields');
      return;
    }

    const packageData = {
      credits: parseInt(creditPackageForm.credits),
      price: parseFloat(creditPackageForm.price),
      label: creditPackageForm.label.trim(),
      sort_order: creditPackageForm.sort_order || 0
    };

    if (editingCreditPackage) {
      handleCreditPackageAction(editingCreditPackage.id, 'update', packageData);
    } else {
      handleCreditPackageAction(null, 'create', packageData);
    }
  };

  return (
    <>
      {/* Credit Packages Management */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-black">Credit Packages Management</h2>
            <p className="text-gray-600 mt-1">Manage credit pricing for image scans (1 credit = 1 scan)</p>
          </div>
          <button
            onClick={() => {
              setEditingCreditPackage(null);
              setCreditPackageForm({ credits: '', price: '', label: '', sort_order: 0 });
              setShowCreditPackageForm(true);
            }}
            className="bg-[#ff4b01] text-white px-4 py-2 rounded-lg hover:bg-[#e64401] transition-colors"
          >
            Add Package
          </button>
        </div>

        {loadingCreditPackages ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4b01]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sort Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No credit packages found. Click "Add Package" to create one.
                    </td>
                  </tr>
                ) : (
                  creditPackages.map((pkg, index) => (
                    <motion.tr
                      key={pkg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{pkg.credits}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          ₹{Number(pkg.price).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">₹{pkg.pricePerCredit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pkg.label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{pkg.sort_order || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCreditPackage(pkg)}
                            className="text-[#ff4b01] hover:text-[#e64401]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the package "${pkg.label}"?`)) {
                                handleCreditPackageAction(pkg.id, 'delete');
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Credit Package Form Modal */}
      {showCreditPackageForm && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-lg p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-black mb-4">
              {editingCreditPackage ? 'Edit Credit Package' : 'Add Credit Package'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Credits *
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditPackageForm.credits}
                  onChange={(e) =>
                    setCreditPackageForm({ ...creditPackageForm, credits: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditPackageForm.price}
                  onChange={(e) =>
                    setCreditPackageForm({ ...creditPackageForm, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label *
                </label>
                <input
                  type="text"
                  value={creditPackageForm.label}
                  onChange={(e) =>
                    setCreditPackageForm({ ...creditPackageForm, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  placeholder="10 Credits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditPackageForm.sort_order}
                  onChange={(e) =>
                    setCreditPackageForm({
                      ...creditPackageForm,
                      sort_order: parseInt(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4b01] focus:border-[#ff4b01]"
                  placeholder="0"
                />
              </div>

              {creditPackageForm.credits && creditPackageForm.price && (
                <div className="bg-[#ff4b01]/10 border border-[#ff4b01]/30 rounded-lg p-3">
                  <p className="text-sm text-[#ff4b01]">
                    <strong>Price per Credit:</strong>{' '}
                    ₹{(parseFloat(creditPackageForm.price) / parseInt(creditPackageForm.credits)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreditPackageForm(false);
                  setEditingCreditPackage(null);
                  setCreditPackageForm({ credits: '', price: '', label: '', sort_order: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCreditPackage}
                className="px-4 py-2 bg-[#ff4b01] text-white rounded-lg hover:bg-[#e64401] transition-colors"
              >
                {editingCreditPackage ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

