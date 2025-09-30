'use client'

interface DashboardHeaderProps {
  onMenuClick: () => void
  userProfile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    email_confirmed: boolean;
    created_at: string;
  } | null
}

export default function DashboardHeader({ onMenuClick, userProfile }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 lg:hidden">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Page title - hidden on mobile, shown on desktop */}
          <h1 className="hidden lg:block text-lg font-medium text-black ml-3">
            Dashboard
          </h1>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-black">
                {userProfile?.first_name && userProfile?.last_name 
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : userProfile?.email || 'User'
                }
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userProfile?.role || 'user'}
              </p>
            </div>
            
            {/* User avatar */}
            <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {userProfile?.first_name?.[0] || userProfile?.email?.[0] || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
