'use client'

interface CacheEntry {
  value: boolean | null
  timestamp: number
  expiresAt: number
}

class FeatureCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly STORAGE_KEY = 'feature_access_cache'

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()
        
        // Only load non-expired entries
        Object.entries(data).forEach(([key, entry]: [string, any]) => {
          if (entry.expiresAt > now) {
            this.cache.set(key, entry)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load feature cache from storage:', error)
    }
  }

  private saveToStorage() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const data = Object.fromEntries(this.cache.entries())
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save feature cache to storage:', error)
    }
  }

  get(key: string): boolean | null | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (entry.expiresAt <= now) {
      this.cache.delete(key)
      this.saveToStorage()
      return undefined
    }

    return entry.value
  }

  set(key: string, value: boolean | null): void {
    const now = Date.now()
    const entry: CacheEntry = {
      value,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    }

    this.cache.set(key, entry)
    this.saveToStorage()
  }

  clear(): void {
    this.cache.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key)
      }
    }
    this.saveToStorage()
  }
}

// Create singleton instance
export const featureCache = new FeatureCache()

// Helper function to create cache keys
export const createCacheKey = (feature: string, userId?: string): string => {
  return `${feature}_${userId || 'anonymous'}`
}
