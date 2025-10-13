'use client'

import { useSupabase } from '@/contexts/SupabaseContext'
import { useEffect, useState } from 'react'

export default function ConnectionStatus() {
  const { isConnected, connectionError, loading } = useSupabase()
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Show status if there's an error or if not connected after loading
    if (connectionError || (!loading && !isConnected)) {
      setShowStatus(true)
    } else if (isConnected) {
      setShowStatus(false)
    }
  }, [isConnected, connectionError, loading])

  if (!showStatus) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`p-4 rounded-lg  border ${
        connectionError 
          ? 'bg-red-50 border-red-200 text-red-800' 
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            connectionError ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <div>
            <h4 className="font-semibold">
              {connectionError ? 'Database Connection Error' : 'Connecting...'}
            </h4>
            <p className="text-sm mt-1">
              {connectionError || 'Attempting to reconnect to database...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowStatus(false)}
          className="mt-2 text-xs underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
