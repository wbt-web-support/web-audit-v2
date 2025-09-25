import { useState, useCallback } from 'react'
import { GeminiAnalysisResult } from '@/lib/gemini'

interface StreamStatus {
  status: 'idle' | 'starting' | 'analyzing' | 'saving' | 'completed' | 'error'
  message: string
  progress: number
  analysis?: GeminiAnalysisResult
  error?: string
  cached?: boolean
}

export function useGeminiStream() {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    status: 'idle',
    message: '',
    progress: 0
  })
  const [isStreaming, setIsStreaming] = useState(false)

  const startAnalysis = useCallback(async (pageId: string, content: string, url: string) => {
    try {
      setIsStreaming(true)
      setStreamStatus({
        status: 'idle',
        message: 'Starting analysis...',
        progress: 0
      })

      // Try streaming API first
      try {
        const response = await fetch('/api/gemini-analysis-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageId,
            content,
            url
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Analysis failed')
        }

        // Check if it's a cached response (immediate JSON)
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const data = await response.json()
          setStreamStatus({
            status: 'completed',
            message: 'Analysis completed',
            progress: 100,
            analysis: data.analysis,
            cached: data.cached
          })
          setIsStreaming(false)
          return data.analysis
        }

        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                setStreamStatus(prev => ({
                  ...prev,
                  ...data
                }))

                if (data.status === 'completed' && data.analysis) {
                  setIsStreaming(false)
                  return data.analysis
                }

                if (data.status === 'error') {
                  setIsStreaming(false)
                  throw new Error(data.error || 'Analysis failed')
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError)
              }
            }
          }
        }

        setIsStreaming(false)
        return null
      } catch (streamError) {
        console.warn('Streaming API failed, falling back to regular API:', streamError)
        
        // Fallback to regular API
        setStreamStatus({
          status: 'analyzing',
          message: 'Using fallback analysis method...',
          progress: 50
        })

        const response = await fetch('/api/gemini-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageId,
            content,
            url
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Analysis failed')
        }

        const data = await response.json()
        
        if (data.success) {
          setStreamStatus({
            status: 'completed',
            message: 'Analysis completed',
            progress: 100,
            analysis: data.analysis,
            cached: data.cached
          })
          setIsStreaming(false)
          return data.analysis
        } else {
          throw new Error(data.error || 'Analysis failed')
        }
      }
    } catch (error) {
      console.error('Error in analysis:', error)
      setStreamStatus({
        status: 'error',
        message: 'Analysis failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      setIsStreaming(false)
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setStreamStatus({
      status: 'idle',
      message: '',
      progress: 0
    })
    setIsStreaming(false)
  }, [])

  return {
    streamStatus,
    isStreaming,
    startAnalysis,
    reset
  }
}
