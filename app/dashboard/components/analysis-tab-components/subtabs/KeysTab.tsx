'use client'

import { AuditProject } from '@/types/audit'

interface KeysTabProps {
  project: AuditProject
}

export default function KeysTab({ project }: KeysTabProps) {
  // Mock data for keys - in real implementation, this would come from the project data
  const detectedKeys = [
    {
      type: 'API Key',
      key: 'sk-1234567890abcdef...',
      location: 'Environment Variables',
      status: 'exposed',
      severity: 'high',
      description: 'OpenAI API key found in environment variables'
    },
    {
      type: 'Database Password',
      key: 'db_pass_***',
      location: 'Config File',
      status: 'secure',
      severity: 'low',
      description: 'Database password properly hashed'
    },
    {
      type: 'JWT Secret',
      key: 'jwt_secret_***',
      location: 'Code',
      status: 'exposed',
      severity: 'critical',
      description: 'JWT secret found in source code'
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exposed':
        return 'bg-red-100 text-red-800'
      case 'secure':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Keys Analysis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This analysis checks for exposed API keys, secrets, and sensitive credentials in your website.
            </p>
          </div>
        </div>
      </div>

      {detectedKeys.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-700">Detected Keys ({detectedKeys.length})</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="text-sm font-medium text-red-600">
                {detectedKeys.filter(key => key.status === 'exposed').length} Exposed
              </span>
              <span className="text-sm font-medium text-green-600">
                {detectedKeys.filter(key => key.status === 'secure').length} Secure
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {detectedKeys.map((key, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-gray-900">{key.type}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(key.severity)}`}>
                        {key.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(key.status)}`}>
                        {key.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Key:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {key.key}
                        </code>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Location:</span>
                        <span className="text-sm text-gray-700">{key.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Description:</span>
                        <span className="text-sm text-gray-700">{key.description}</span>
                      </div>
                    </div>
                  </div>
                  
                  {key.status === 'exposed' && (
                    <div className="ml-4">
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-gray-600">No keys detected</p>
          <p className="text-sm text-gray-500 mt-1">Your website appears to be secure</p>
        </div>
      )}
    </div>
  )
}
