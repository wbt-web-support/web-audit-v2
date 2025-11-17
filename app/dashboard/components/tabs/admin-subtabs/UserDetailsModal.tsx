'use client';

import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'admin';
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
  blocked?: boolean;
  blocked_at?: string;
  blocked_by?: string;
  role_changed_at?: string;
  role_changed_by?: string;
  last_activity_at?: string;
  login_count?: number;
  notes?: string;
  plan_type?: string;
  auth_users?: {
    last_sign_in_at: string;
    email_confirmed_at: string;
    raw_user_meta_data?: {
      full_name?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
    app_metadata?: {
      provider?: string;
    };
  };
  project_count?: number;
  plan_limit?: number;
  plan_name?: string;
  subscription_status?: string;
  image_scan_credits?: number;
}

interface UserActivity {
  totalProjects?: number;
  totalTickets?: number;
  lastProject?: string;
  lastTicket?: string;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  user: User | null;
  userActivity: Record<string, unknown> | null;
  actionLoading: string | null;
  onClose: () => void;
  onUserAction: (userId: string, action: string, value?: unknown) => void;
}

const getUserDisplayName = (user: User) => {
  // Try to get from Google auth data first
  const googleFirstName = user.auth_users?.raw_user_meta_data?.first_name || 
    user.auth_users?.raw_user_meta_data?.full_name?.split(' ')[0];
  const googleLastName = user.auth_users?.raw_user_meta_data?.last_name || 
    user.auth_users?.raw_user_meta_data?.full_name?.split(' ').slice(1).join(' ');
  const googleFullName = user.auth_users?.raw_user_meta_data?.full_name || 
    user.auth_users?.raw_user_meta_data?.name;

  // Use Google data if available, otherwise use database data
  if (googleFullName) {
    return googleFullName;
  }
  if (googleFirstName && googleLastName) {
    return `${googleFirstName} ${googleLastName}`;
  }
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (googleFirstName || user.first_name) {
    return googleFirstName || user.first_name || '';
  }
  return user.email.split('@')[0];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderDateField = (value: unknown, label: string) => {
  if (value && typeof value === 'string') {
    return (
      <div className="bg-gray-50 rounded p-4">
        <div>
          <span className="text-gray-600 text-sm">{label}</span>
          <p className="text-black font-medium mt-1">{formatDate(value)}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function UserDetailsModal({
  isOpen,
  user,
  userActivity,
  actionLoading,
  onClose,
  onUserAction
}: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-black truncate">
                {getUserDisplayName(user)}
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base truncate">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl sm:text-3xl flex-shrink-0"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">First Name</label>
                  <div className="flex items-center gap-2">
                    <p className="text-black font-medium">
                      {user.first_name || user.auth_users?.raw_user_meta_data?.first_name || user.auth_users?.raw_user_meta_data?.full_name?.split(' ')[0] || 'Not provided'}
                    </p>
                    {(!user.first_name && (user.auth_users?.raw_user_meta_data?.first_name || user.auth_users?.raw_user_meta_data?.full_name)) && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded" title="From Google account">
                        Google
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Last Name</label>
                  <div className="flex items-center gap-2">
                    <p className="text-black font-medium">
                      {user.last_name || user.auth_users?.raw_user_meta_data?.last_name || user.auth_users?.raw_user_meta_data?.full_name?.split(' ').slice(1).join(' ') || 'Not provided'}
                    </p>
                    {(!user.last_name && (user.auth_users?.raw_user_meta_data?.last_name || user.auth_users?.raw_user_meta_data?.full_name)) && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded" title="From Google account">
                        Google
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Full Name</label>
                  <p className="text-black font-medium">{getUserDisplayName(user)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Email</label>
                  <p className="text-black font-medium break-words">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Email Status</label>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      user.email_confirmed
                        ? 'bg-[#ff4b01]/20 text-[#ff4b01]'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.email_confirmed ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Role</label>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-[#ff4b01]/20 text-[#ff4b01]'
                    }`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Status</label>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      user.blocked
                        ? 'bg-red-100 text-red-800'
                        : user.email_confirmed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.blocked
                      ? 'Blocked'
                      : user.email_confirmed
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Created</label>
                  <p className="text-black font-medium">{formatDate(user.created_at)}</p>
                </div>
                {user.last_activity_at && (
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Last Activity</label>
                    <p className="text-black font-medium">{formatDate(user.last_activity_at)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Current Plan</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        user.plan_name === 'pro'
                          ? 'bg-purple-100 text-purple-800'
                          : user.plan_name === 'basic'
                          ? 'bg-[#ff4b01]/20 text-[#ff4b01]'
                          : user.plan_name === 'free'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.plan_name || 'No Plan'}
                    </span>
                    {user.plan_type && (
                      <span className="text-xs text-gray-500">({user.plan_type})</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Project Limit</label>
                  <p className="text-black font-medium">
                    {user.plan_limit === -1
                      ? 'Unlimited'
                      : user.plan_limit !== undefined && user.plan_limit !== null
                      ? `${user.plan_limit} projects`
                      : user.plan_type
                      ? 'No limit set'
                      : 'No plan assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Current Projects</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-black font-medium">{user.project_count || 0}</p>
                    {user.plan_limit === -1 ? (
                      <span className="text-sm text-gray-500">unlimited</span>
                    ) : user.plan_limit !== undefined && user.plan_limit !== null ? (
                      <span className="text-sm text-gray-500">of {user.plan_limit}</span>
                    ) : user.plan_type ? (
                      <span className="text-sm text-gray-500">no limit set</span>
                    ) : (
                      <span className="text-sm text-gray-500">no plan</span>
                    )}
                    {user.plan_limit &&
                      user.plan_limit > 0 &&
                      user.project_count &&
                      user.project_count > user.plan_limit && (
                        <span className="text-xs text-red-500 font-medium">(Exceeded!)</span>
                      )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Image Scan Credits</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-medium ${
                        (user.image_scan_credits ?? 0) < 5 ? 'text-yellow-600' : 'text-black'
                      }`}
                    >
                      {user.image_scan_credits ?? 0}
                    </p>
                    {(user.image_scan_credits ?? 0) < 5 &&
                      (user.image_scan_credits ?? 0) > 0 && (
                        <span className="text-xs text-yellow-600">⚠️ Low credits</span>
                      )}
                    {(user.image_scan_credits ?? 0) === 0 && (
                      <span className="text-xs text-red-600">⚠️ No credits</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Activity Summary</h3>
              {userActivity ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Projects</span>
                      <span className="text-xl font-semibold text-black">
                        {typeof userActivity.totalProjects === 'number'
                          ? userActivity.totalProjects
                          : 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Tickets</span>
                      <span className="text-xl font-semibold text-black">
                        {typeof userActivity.totalTickets === 'number'
                          ? userActivity.totalTickets
                          : 0}
                      </span>
                    </div>
                  </div>
                  {renderDateField(userActivity.lastProject, 'Last Project')}
                  {renderDateField(userActivity.lastTicket, 'Last Ticket')}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading activity...</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const newRole = user.role === 'admin' ? 'user' : 'admin';
                onUserAction(user.id, 'changeRole', newRole);
              }}
              disabled={actionLoading === 'changeRole'}
              className="w-full sm:w-auto px-4 py-2 bg-[#ff4b01] text-white rounded hover:bg-[#e64401] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              {actionLoading === 'changeRole'
                ? 'Changing...'
                : `Change to ${user.role === 'admin' ? 'User' : 'Admin'}`}
            </button>
            {user.blocked ? (
              <button
                onClick={() => onUserAction(user.id, 'unblock')}
                disabled={actionLoading === 'unblock'}
                className="w-full sm:w-auto px-4 py-2 bg-[#ff4b01] text-white rounded hover:bg-[#e64401] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                {actionLoading === 'unblock' ? 'Unblocking...' : 'Unblock User'}
              </button>
            ) : (
              <button
                onClick={() => onUserAction(user.id, 'block')}
                disabled={actionLoading === 'block'}
                className="w-full sm:w-auto px-4 py-2 bg-[#ff4b01] text-white rounded hover:bg-[#e64401] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                {actionLoading === 'block' ? 'Blocking...' : 'Block User'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

