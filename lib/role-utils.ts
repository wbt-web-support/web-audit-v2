'use client';

import { supabase } from './supabase-client';
export type UserRole = 'user' | 'admin';
export interface RoleVerificationResult {
  isAdmin: boolean;
  isUser: boolean;
  role: UserRole;
  verified: boolean;
  error?: string;
}

/**
 * Comprehensive role verification utility
 */
export class RoleVerifier {
  private static instance: RoleVerifier;
  private roleCache: Map<string, {
    result: RoleVerificationResult;
    timestamp: number;
  }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): RoleVerifier {
    if (!RoleVerifier.instance) {
      RoleVerifier.instance = new RoleVerifier();
    }
    return RoleVerifier.instance;
  }

  /**
   * Verify user role with caching and comprehensive error handling
   */
  async verifyUserRole(userId: string, forceRefresh = false): Promise<RoleVerificationResult> {
    // Check cache first
    if (!forceRefresh && this.roleCache.has(userId)) {
      const cached = this.roleCache.get(userId)!;
      const now = Date.now();
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.result;
      }
    }
    try {
      // Get current user from auth
      const {
        data: {
          user
        },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Auth user error:', userError);
        return this.createErrorResult('Authentication failed');
      }
      if (user.id !== userId) {
        console.error('User ID mismatch:', {
          requested: userId,
          authenticated: user.id
        });
        return this.createErrorResult('User ID mismatch');
      }

      // Fetch user profile from database
      const {
        data: profile,
        error: profileError
      } = await supabase.from('users').select('role, email_confirmed, created_at').eq('id', userId).single();
      
      // Handle profile fetch errors gracefully
      if (profileError) {
        // Check if it's a "not found" error (PGRST116) - profile might not exist yet
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
          console.warn('Profile not found for user:', userId, '- User may need to complete registration');
          // Return default user role if profile doesn't exist yet
          return {
            isAdmin: false,
            isUser: true,
            role: 'user' as UserRole,
            verified: false,
            error: 'User profile not found - may need to complete registration'
          };
        }
        console.error('Profile fetch error:', profileError);
        const errorMessage = profileError.message || profileError.code || 'Unknown database error';
        return this.createErrorResult(`Database error: ${errorMessage}`);
      }
      
      if (!profile) {
        console.warn('Profile not found for user:', userId);
        // Return default user role if profile doesn't exist
        return {
          isAdmin: false,
          isUser: true,
          role: 'user' as UserRole,
          verified: false,
          error: 'User profile not found'
        };
      }
      const role = profile.role as UserRole;
      const result: RoleVerificationResult = {
        isAdmin: role === 'admin',
        isUser: role === 'user',
        role,
        verified: true
      };

      // Cache the result
      this.roleCache.set(userId, {
        result,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      console.error('Role verification error:', error);
      return this.createErrorResult(`Unexpected error: ${error}`);
    }
  }

  /**
   * Check if user has admin access
   */
  async isAdmin(userId: string): Promise<boolean> {
    const result = await this.verifyUserRole(userId);
    return result.isAdmin && result.verified;
  }

  /**
   * Check if user has admin access
   */
  async isAdminUser(userId: string): Promise<boolean> {
    const result = await this.verifyUserRole(userId);
    return result.isAdmin && result.verified;
  }

  /**
   * Get user role with verification
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    const result = await this.verifyUserRole(userId);
    return result.verified ? result.role : null;
  }

  /**
   * Clear role cache for a user
   */
  clearUserCache(userId: string): void {
    this.roleCache.delete(userId);
  }

  /**
   * Clear all role cache
   */
  clearAllCache(): void {
    this.roleCache.clear();
  }
  private createErrorResult(error: string): RoleVerificationResult {
    return {
      isAdmin: false,
      isUser: false,
      role: 'user',
      verified: false,
      error
    };
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
    success: boolean;
    result: RoleVerificationResult;
    tests: {
      isAdmin: boolean;
      isUser: boolean;
      roleMatch: boolean;
    };
  }> {
    const verifier = RoleVerifier.getInstance();
    const result = await verifier.verifyUserRole(userId, true); // Force refresh

    const tests = {
      isAdmin: result.isAdmin,
      isUser: result.isUser,
      roleMatch: result.verified && result.role !== null
    };
    const success = result.verified && tests.roleMatch;
    return {
      success,
      result,
      tests
    };
  }

  /**
   * Test admin access specifically
   */
  static async testAdminAccess(userId: string): Promise<{
    hasAccess: boolean;
    isAdmin: boolean;
    error?: string;
  }> {
    const verifier = RoleVerifier.getInstance();
    const result = await verifier.verifyUserRole(userId, true);
    return {
      hasAccess: result.isAdmin && result.verified,
      isAdmin: result.isAdmin,
      error: result.error
    };
  }

}

// Export singleton instance
export const roleVerifier = RoleVerifier.getInstance();
export const roleTester = RoleTester;