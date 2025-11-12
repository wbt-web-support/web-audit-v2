'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { roleVerifier } from '@/lib/role-utils';
import { useUserPlan } from '@/hooks/useUserPlan';
interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    email_confirmed: boolean;
    created_at: string;
  } | null;
  selectedProjectId?: string | null;
}
export default function DashboardSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  userProfile,
  selectedProjectId
}: DashboardSidebarProps) {
  const {
    signOut,
    user
  } = useSupabase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [userInitial, setUserInitial] = useState<string>('U');

  // Get user plan information
  const {
    planInfo,
    loading: planLoading,
    refreshPlan
  } = useUserPlan();

  // Real-time role verification
  const verifyRole = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }
    try {
      setRoleLoading(true);
      const result = await roleVerifier.verifyUserRole(user.id, false); // Use cache if available
      const adminStatus = result.isAdmin && result.verified;
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Sidebar role verification error:', error);
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  }, [user]);
  useEffect(() => {
    verifyRole();
  }, [verifyRole]);

  // Update display name when userProfile changes
  useEffect(() => {
    if (userProfile?.first_name && userProfile?.last_name) {
      const fullName = `${userProfile.first_name} ${userProfile.last_name}`;
      setDisplayName(fullName);
      setUserInitial(userProfile.first_name[0].toUpperCase());
    } else if (userProfile?.first_name) {
      setDisplayName(userProfile.first_name);
      setUserInitial(userProfile.first_name[0].toUpperCase());
    } else if (userProfile?.last_name) {
      setDisplayName(userProfile.last_name);
      setUserInitial(userProfile.last_name[0].toUpperCase());
    } else if (userProfile?.email) {
      setDisplayName(userProfile.email.split('@')[0]);
      setUserInitial(userProfile.email[0].toUpperCase());
    } else {
      setDisplayName('User');
      setUserInitial('U');
    }
  }, [userProfile]);

  // Refresh plan information when user changes
  const handlePlanRefresh = useCallback(() => {
    if (user && refreshPlan) {
      refreshPlan();
    }
  }, [user, refreshPlan]);
  useEffect(() => {
    handlePlanRefresh();
  }, [handlePlanRefresh]);

  // Debug plan information (only log when plan info actually changes)
  useEffect(() => {
    if (planInfo) {}
  }, [planInfo, planLoading, user?.id]);

  // Memoize navigation items to prevent re-creation on every render
  const navigationItems = useMemo(() => {
    const baseItems = [{
      id: 'dashboard',
      name: 'Dashboard',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
    }, {
      id: 'projects',
      name: 'Projects',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    }];

    // Add analysis tab if needed
    if (activeTab === 'analysis' && selectedProjectId) {
      baseItems.push({
        id: 'analysis',
        name: 'Analysis',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
      });
    }

    // Add profile tab
    baseItems.push({
      id: 'profile',
      name: 'Profile',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    });

    // Add admin tab if user is admin
    if (isAdmin === true) {
      baseItems.push({
        id: 'admin',
        name: 'Admin',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
      });
    }
    return baseItems;
  }, [activeTab, selectedProjectId, isAdmin]);
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  return <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && <motion.div className="fixed inset-0 bg-black/40 bg-opacity-50 z-40 lg:hidden" onClick={onClose} initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.2
      }} />}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && <motion.div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:hidden" initial={{
        x: -256
      }} animate={{
        x: 0
      }} exit={{
        x: -256
      }} transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between  border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/orange-black-auditly.png"
                alt="Auditly360"
                width={134}
                height={53}
                className="h-8 w-auto mx-"
              />
            </Link>
            <button onClick={onClose} className="lg:hidden p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-700 font-medium text-sm">
                  {userInitial}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">
                  {displayName} 
                </p>
                {/* <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-600 capitalize">
                    {userProfile?.role || 'user'}
                  </p>
                  {roleLoading && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                  {isAdmin === true && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Admin
                    </span>}
                  {isAdmin === false && !roleLoading && userProfile?.role === 'admin' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Role Pending
                    </span>}
                </div> */}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map(item => <button key={item.id} onClick={() => {
              onTabChange(item.id);
              onClose();
            }} className={`w-full flex items-center space-x-3 px-3 py-3 rounded text-sm font-medium ${activeTab === item.id ? 'bg-[#FF4B01]/10 text-[#FF4B01]' : 'text-gray-700'}`}>
                <span className={activeTab === item.id ? 'text-[#FF4B01]' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>)}
          </nav>

          {/* Plan Information */}
          <div className="p-4 border-t border-gray-200">
            {planLoading ? <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#FF4B01] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading plan...</span>
                </div>
              </div> : planInfo ? <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Current Plan</span>
                  {/* <span className={`text-xs px-2 py-1 rounded-full font-medium ${planInfo.plan_type === 'Starter' ? 'bg-green-100 text-green-700' : planInfo.plan_type === 'Growth' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {planInfo.plan_name || 'Unknown Plan'}
                  </span> */}
                </div>
                <div className='text-sm font-medium text-black mb-1'>
                  {planInfo.plan_name || 'Unknown Plan'}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{planInfo.can_use_features?.length || 0} features</span>
                  <span>
                    {planInfo.max_projects === -1 ? 'Unlimited' : planInfo.max_projects || 0} projects
                  </span>
                </div>
                {planInfo.plan_type === 'Starter' && <button onClick={() => onTabChange('profile')} className="w-full mt-2 text-xs bg-[#FF4B01] text-white py-1 px-2 rounded hover:bg-[#FF4B01]/90 transition-colors">
                    Upgrade Plan
                  </button>}
              </div> : <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 text-center">
                  No plan information available
                </div>
                <button onClick={() => refreshPlan && refreshPlan()} className="w-full mt-2 text-xs bg-gray-600 text-white py-1 px-2 rounded hover:bg-gray-700 transition-colors">
                  Refresh Plan
                </button>
              </div>}
          </div>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200">
            <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-3 py-3 rounded text-sm font-medium text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
          </motion.div>}
      </AnimatePresence>

      {/* Desktop Sidebar - Always visible on large screens */}
      <motion.div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200" initial={{
      opacity: 0,
      x: -20
    }} animate={{
      opacity: 1,
      x: 0
    }} transition={{
      duration: 0.4,
      ease: "easeOut"
    }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/orange-black-auditly.png"
                alt="Auditly360"
                width={124}
                height={43}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-700 font-medium text-sm">
                  {userInitial}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">
                  {displayName}
                </p>
                {/* <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-600 capitalize">
                    {userProfile?.role || 'user'}
                  </p>
                  {roleLoading && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                  {isAdmin === true && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Admin
                    </span>}
                  {isAdmin === false && !roleLoading && userProfile?.role === 'admin' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Role Pending
                    </span>}
                </div> */}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map(item => <button key={item.id} onClick={() => onTabChange(item.id)} className={`w-full flex items-center space-x-3 px-3 py-3 rounded text-sm font-medium ${activeTab === item.id ? 'bg-[#FF4B01]/10 text-[#FF4B01]' : 'text-gray-700'}`}>
                <span className={activeTab === item.id ? 'text-[#FF4B01]' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>)}
          </nav>

          {/* Plan Information */}
          <div className="p-4 border-t border-gray-200">
            {planLoading ? <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#FF4B01] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading plan...</span>
                </div>
              </div> : planInfo ? <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Current Plan</span>
                  {/* <span className={`text-xs px-2 py-1 rounded-full font-medium ${planInfo.plan_type === 'Starter' ? 'bg-green-100 text-green-700' : planInfo.plan_type === 'Growth' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {planInfo.plan_name || 'Unknown Plan'}
                  </span> */}
                </div>
                <div className='text-sm font-medium text-black mb-1'>
                  {planInfo.plan_name || 'Unknown Plan'}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{planInfo.can_use_features?.length || 0} features</span>
                  <span>
                    {planInfo.max_projects === -1 ? 'Unlimited' : planInfo.max_projects || 0} projects
                  </span>
                </div>
                {planInfo.plan_type === 'Starter' && <button onClick={() => onTabChange('profile')} className="w-full mt-2 text-xs bg-[#FF4B01] text-white py-1 px-2 rounded hover:bg-[#FF4B01]/90 transition-colors">
                    Upgrade Plan
                  </button>}
              </div> : <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 text-center">
                  No plan information available
                </div>
                <button onClick={() => refreshPlan && refreshPlan()} className="w-full mt-2 text-xs bg-gray-600 text-white py-1 px-2 rounded hover:bg-gray-700 transition-colors">
                  Refresh Plan
                </button>
              </div>}
          </div>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200">
            <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-3 py-3 rounded text-sm font-medium text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>;
}