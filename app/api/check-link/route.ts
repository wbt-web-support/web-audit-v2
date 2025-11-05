import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkFeatureAccess } from '@/lib/plan-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'MISSING_AUTH',
        isBroken: true
      }, {
        status: 401
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token',
        code: 'INVALID_AUTH',
        details: authError?.message || 'Token verification failed',
        isBroken: true
      }, {
        status: 401
      });
    }

    // Check if user has access to broken_links_check feature
    const featureAccess = await checkFeatureAccess(user.id, 'broken_links_check');
    
    if (!featureAccess.hasAccess) {
      console.warn('🚫 User attempted to use broken_links_check feature without access:', {
        userId: user.id,
        userPlan: featureAccess.userPlan,
        error: featureAccess.error
      });
      
      return NextResponse.json({
        error: 'Feature access denied',
        code: 'FEATURE_ACCESS_DENIED',
        message: featureAccess.error || 'Broken Links Check is not available in your current plan',
        userPlan: featureAccess.userPlan,
        requiredFeature: 'broken_links_check',
        isBroken: true
      }, {
        status: 403
      });
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required', isBroken: true },
        { status: 400 }
      );
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format', isBroken: true },
        { status: 400 }
      );
    }

    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP/HTTPS URLs are allowed', isBroken: true },
        { status: 400 }
      );
    }

    try {
      // Use HEAD request first (lighter), fallback to GET if HEAD fails
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        clearTimeout(timeoutId);
      } catch (headError) {
        clearTimeout(timeoutId);
        // If HEAD fails, try GET
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 10000);
        
        try {
          response = await fetch(url, {
            method: 'GET',
            signal: getController.signal,
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          clearTimeout(getTimeoutId);
        } catch (getError) {
          clearTimeout(getTimeoutId);
          return NextResponse.json({
            isBroken: true,
            status: 'error',
            error: 'Failed to fetch URL',
          });
        }
      }

      // Consider 2xx and 3xx as working links
      const isWorking = response.status >= 200 && response.status < 400;

      return NextResponse.json({
        isBroken: !isWorking,
        status: isWorking ? 'working' : 'broken',
        httpStatus: response.status,
        statusText: response.statusText,
      });
    } catch (error) {
      console.error('Error checking link:', error);
      return NextResponse.json({
        isBroken: true,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Invalid request', isBroken: true },
      { status: 400 }
    );
  }
}

