'use client'

import { supabase } from './supabase'

export type UserRole = 'user' | 'admin' | 'moderator'

export interface RoleVerificationResult {
  isAdmin: boolean
  isModerator: boolean
  isUser: boolean
  role: UserRole
  verified: boolean
  error?: string
}

/**
 * Comprehensive role verification utility
 */
export class RoleVerifier {
  private static instance: RoleVerifier
  private roleCache: Map<string, { result: RoleVerificationResult; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): RoleVerifier {
    if (!RoleVerifier.instance) {
      RoleVerifier.instance = new RoleVerifier()
    }
    return RoleVerifier.instance
  }

  /**
   * Verify user role with caching and comprehensive error handling
   */
  async verifyUserRole(userId: string, forceRefresh = false): Promise<RoleVerificationResult> {
    // Check cache first
    if (!forceRefresh && this.roleCache.has(userId)) {
      const cached = this.roleCache.get(userId)!
      const now = Date.now()
      if (now - cached.timestamp < this.CACHE_DURATION) {
        console.log('Using cached role verification:', cached.result)
        return cached.result
      }
    }

    try {
      console.log('🔍 Verifying role for user:', userId)
      
      // Get current user from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Auth user error:', userError)
        return this.createErrorResult('Authentication failed')
      }

      if (user.id !== userId) {
        console.error('User ID mismatch:', { requested: userId, authenticated: user.id })
        return this.createErrorResult('User ID mismatch')
      }

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, email_confirmed, created_at')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        return this.createErrorResult(`Database error: ${profileError.message}`)
      }

      if (!profile) {
        console.error('Profile not found for user:', userId)
        return this.createErrorResult('User profile not found')
      }

      const role = profile.role as UserRole
      const result: RoleVerificationResult = {
        isAdmin: role === 'admin',
        isModerator: role === 'moderator',
        isUser: role === 'user',
        role,
        verified: true
      }

      // Cache the result
      this.roleCache.set(userId, {
        result,
        timestamp: Date.now()
      })

      console.log('✅ Role verification successful:', result)
      return result

    } catch (error) {
      console.error('Role verification error:', error)
      return this.createErrorResult(`Unexpected error: ${error}`)
    }
  }

  /**
   * Check if user has admin access
   */
  async isAdmin(userId: string): Promise<boolean> {
    const result = await this.verifyUserRole(userId)
    return result.isAdmin && result.verified
  }

  /**
   * Check if user has moderator or admin access
   */
  async isModeratorOrAdmin(userId: string): Promise<boolean> {
    const result = await this.verifyUserRole(userId)
    return (result.isModerator || result.isAdmin) && result.verified
  }

  /**
   * Get user role with verification
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    const result = await this.verifyUserRole(userId)
    return result.verified ? result.role : null
  }

  /**
   * Clear role cache for a user
   */
  clearUserCache(userId: string): void {
    this.roleCache.delete(userId)
    console.log('Cleared role cache for user:', userId)
  }

  /**
   * Clear all role cache
   */
  clearAllCache(): void {
    this.roleCache.clear()
    console.log('Cleared all role cache')
  }

  private createErrorResult(error: string): RoleVerificationResult {
    return {
      isAdmin: false,
      isModerator: false,
      isUser: false,
      role: 'user',
      verified: false,
      error
    }
  }
}

/**
 * Role testing utilities
 */
export class RoleTester {
  /**
   * Test role verification for a user
   */
  static async testUserRole(userId: string): Promise<{
    success: boolean
    result: RoleVerificationResult
    tests: {
      isAdmin: boolean
      isModerator: boolean
      isUser: boolean
      roleMatch: boolean
    }
  }> {
    console.log('🧪 Testing role verification for user:', userId)
    
    const verifier = RoleVerifier.getInstance()
    const result = await verifier.verifyUserRole(userId, true) // Force refresh
    
    const tests = {
      isAdmin: result.isAdmin,
      isModerator: result.isModerator,
      isUser: result.isUser,
      roleMatch: result.verified && result.role !== null
    }

    const success = result.verified && tests.roleMatch

    console.log('🧪 Role test results:', {
      success,
      result,
      tests
    })

    return { success, result, tests }
  }

  /**
   * Test admin access specifically
   */
  static async testAdminAccess(userId: string): Promise<{
    hasAccess: boolean
    isAdmin: boolean
    error?: string
  }> {
    const verifier = RoleVerifier.getInstance()
    const result = await verifier.verifyUserRole(userId, true)
    
    return {
      hasAccess: result.isAdmin && result.verified,
      isAdmin: result.isAdmin,
      error: result.error
    }
  }

  /**
   * Test moderator access
   */
  static async testModeratorAccess(userId: string): Promise<{
    hasAccess: boolean
    isModerator: boolean
    isAdmin: boolean
    error?: string
  }> {
    const verifier = RoleVerifier.getInstance()
    const result = await verifier.verifyUserRole(userId, true)
    
    return {
      hasAccess: (result.isModerator || result.isAdmin) && result.verified,
      isModerator: result.isModerator,
      isAdmin: result.isAdmin,
      error: result.error
    }
  }
}

// Export singleton instance
export const roleVerifier = RoleVerifier.getInstance()
export const roleTester = RoleTester
