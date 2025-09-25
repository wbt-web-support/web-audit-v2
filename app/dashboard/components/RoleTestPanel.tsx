'use client'

import { useState } from 'react'
import { useSupabase } from '@/contexts/SupabaseContext'
import { roleVerifier, roleTester, RoleVerificationResult } from '@/lib/role-utils'

interface RoleTestPanelProps {
  userProfile: any
}

export default function RoleTestPanel({ userProfile }: RoleTestPanelProps) {
  const { user } = useSupabase()
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runRoleTests = async () => {
    if (!user) {
      setError('No authenticated user found')
      return
    }

    setIsRunning(true)
    setError(null)
    setTestResults(null)

    try {
      console.log('🧪 Starting comprehensive role tests for user:', user.id)
      
      // Test 1: Basic role verification
      const basicVerification = await roleVerifier.verifyUserRole(user.id, true)
      
      // Test 2: Admin access test
      const adminTest = await roleTester.testAdminAccess(user.id)
      
      // Test 3: Moderator access test
      const moderatorTest = await roleTester.testModeratorAccess(user.id)
      
      // Test 4: Full role test
      const fullRoleTest = await roleTester.testUserRole(user.id)
      
      // Test 5: Cache test
      const cachedVerification = await roleVerifier.verifyUserRole(user.id, false)
      
      const results = {
        timestamp: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        profileRole: userProfile?.role,
        tests: {
          basicVerification,
          adminTest,
          moderatorTest,
          fullRoleTest,
          cachedVerification
        },
        summary: {
          isAdmin: basicVerification.isAdmin,
          isModerator: basicVerification.isModerator,
          isUser: basicVerification.isUser,
          verified: basicVerification.verified,
          role: basicVerification.role,
          hasAdminAccess: adminTest.hasAccess,
          hasModeratorAccess: moderatorTest.hasAccess
        }
      }

      setTestResults(results)
      console.log('🧪 Role test results:', results)
      
    } catch (error) {
      console.error('Role test error:', error)
      setError(`Test failed: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const clearCache = () => {
    roleVerifier.clearAllCache()
    console.log('🧹 Cleared all role cache')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Role Testing Panel</h3>
        <div className="flex space-x-2">
          <button
            onClick={runRoleTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run Role Tests'}
          </button>
          <button
            onClick={clearCache}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Current User Info */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Current User Info</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not available'}</p>
          <p><strong>Profile Role:</strong> {userProfile?.role || 'Not available'}</p>
          <p><strong>Email Confirmed:</strong> {userProfile?.email_confirmed ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Error</h4>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Test Summary</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Role:</strong> {testResults.summary.role}</p>
              <p><strong>Verified:</strong> {testResults.summary.verified ? 'Yes' : 'No'}</p>
              <p><strong>Is Admin:</strong> {testResults.summary.isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>Is Moderator:</strong> {testResults.summary.isModerator ? 'Yes' : 'No'}</p>
              <p><strong>Has Admin Access:</strong> {testResults.summary.hasAdminAccess ? 'Yes' : 'No'}</p>
              <p><strong>Has Moderator Access:</strong> {testResults.summary.hasModeratorAccess ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Detailed Test Results */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Detailed Test Results</h4>
            
            {/* Basic Verification */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Basic Role Verification</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Verified:</strong> {testResults.tests.basicVerification.verified ? 'Yes' : 'No'}</p>
                <p><strong>Role:</strong> {testResults.tests.basicVerification.role}</p>
                <p><strong>Is Admin:</strong> {testResults.tests.basicVerification.isAdmin ? 'Yes' : 'No'}</p>
                {testResults.tests.basicVerification.error && (
                  <p className="text-red-600"><strong>Error:</strong> {testResults.tests.basicVerification.error}</p>
                )}
              </div>
            </div>

            {/* Admin Test */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Admin Access Test</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Has Access:</strong> {testResults.tests.adminTest.hasAccess ? 'Yes' : 'No'}</p>
                <p><strong>Is Admin:</strong> {testResults.tests.adminTest.isAdmin ? 'Yes' : 'No'}</p>
                {testResults.tests.adminTest.error && (
                  <p className="text-red-600"><strong>Error:</strong> {testResults.tests.adminTest.error}</p>
                )}
              </div>
            </div>

            {/* Moderator Test */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Moderator Access Test</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Has Access:</strong> {testResults.tests.moderatorTest.hasAccess ? 'Yes' : 'No'}</p>
                <p><strong>Is Moderator:</strong> {testResults.tests.moderatorTest.isModerator ? 'Yes' : 'No'}</p>
                <p><strong>Is Admin:</strong> {testResults.tests.moderatorTest.isAdmin ? 'Yes' : 'No'}</p>
                {testResults.tests.moderatorTest.error && (
                  <p className="text-red-600"><strong>Error:</strong> {testResults.tests.moderatorTest.error}</p>
                )}
              </div>
            </div>

            {/* Full Role Test */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Full Role Test</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Success:</strong> {testResults.tests.fullRoleTest.success ? 'Yes' : 'No'}</p>
                <p><strong>Role Match:</strong> {testResults.tests.fullRoleTest.tests.roleMatch ? 'Yes' : 'No'}</p>
                <p><strong>Is Admin:</strong> {testResults.tests.fullRoleTest.tests.isAdmin ? 'Yes' : 'No'}</p>
                <p><strong>Is Moderator:</strong> {testResults.tests.fullRoleTest.tests.isModerator ? 'Yes' : 'No'}</p>
                <p><strong>Is User:</strong> {testResults.tests.fullRoleTest.tests.isUser ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Cache Test */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Cache Test</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Verified:</strong> {testResults.tests.cachedVerification.verified ? 'Yes' : 'No'}</p>
                <p><strong>Role:</strong> {testResults.tests.cachedVerification.role}</p>
                <p><strong>Is Admin:</strong> {testResults.tests.cachedVerification.isAdmin ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Raw Results */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-600">
              Raw Test Data
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
