'use server';

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body?.url) {
      return new Response(JSON.stringify({
        error: 'URL is required',
        code: 'MISSING_URL'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header received:', {
      hasHeader: !!authHeader,
      headerStart: authHeader?.substring(0, 20) + '...',
      headerLength: authHeader?.length
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return new Response(JSON.stringify({
        error: 'Authentication required',
        code: 'MISSING_AUTH'
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Token extracted:', {
      hasToken: !!token,
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...'
    });
    
    // Verify user and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('🔐 Auth verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!authError,
      errorMessage: authError?.message
    });

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({
        error: 'Invalid authentication token',
        code: 'INVALID_AUTH',
        details: authError?.message || 'Token verification failed'
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Note: Project limit and feature validation is now handled at the project creation level
    // in the createAuditProject function in SupabaseContext.tsx

    // Get API configuration from environment variables
    let apiBaseUrl = process.env.SCRAPER_API_BASE_URL || 'http://localhost:3001';
    
    // Clean the URL by removing any leading '=' characters
    apiBaseUrl = apiBaseUrl.replace(/^=+/, '');
    
    const apiKey = process.env.SCRAPER_API_KEY;
    const endpoint = `${apiBaseUrl}/scrap`;
    
    // Check if we're using localhost and provide helpful error
    if (apiBaseUrl.includes('localhost') && !process.env.SCRAPER_API_BASE_URL) {
      console.warn('⚠️ Using default localhost scraping service. Make sure the scraping service is running on port 3001');
    }
    
    // Validate the endpoint URL
    try {
      new URL(endpoint);
    } catch (urlError) {
      console.error('❌ Invalid endpoint URL:', endpoint, urlError);
      return new Response(JSON.stringify({
        error: 'Invalid API endpoint configuration',
        details: `Invalid URL: ${endpoint}`,
        code: 'INVALID_ENDPOINT'
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    

    // Prepare headers
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'WebAudit/1.0'
    };
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Prepare request body with fallback values
    const scrapeData = {
      url: body.url,
      mode: body.mode || 'single',
      maxPages: body.maxPages || 100,
      extractImagesFlag: body.extractImagesFlag !== undefined ? body.extractImagesFlag : true,
      extractLinksFlag: body.extractLinksFlag !== undefined ? body.extractLinksFlag : true,
      detectTechnologiesFlag: body.detectTechnologiesFlag !== undefined ? body.detectTechnologiesFlag : true
    };

    // Make the upstream request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 180000); // 3 minute timeout

    try {
      const upstreamResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(scrapeData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!upstreamResponse.ok) {
        const errorText = await upstreamResponse.text().catch(() => 'Unable to read error response');
        console.error('❌ Scraping API error response:', errorText);
        
        return new Response(JSON.stringify({
          error: `Scraping API error: ${upstreamResponse.status} - ${upstreamResponse.statusText}`,
          details: errorText,
          status: upstreamResponse.status
        }), { 
          status: upstreamResponse.status, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Parse and return successful response
      const data = await upstreamResponse.json();
      return new Response(JSON.stringify(data), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({
          error: 'Request timeout',
          message: 'Scraping request timed out after 3 minutes'
        }), { 
          status: 408, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Handle connection refused error specifically
      if (fetchError instanceof Error && fetchError.message.includes('ECONNREFUSED')) {
        return new Response(JSON.stringify({
          error: 'Scraping service unavailable',
          message: 'The scraping service is not running. Please check if the scraping service is started on the configured endpoint.',
          details: `Endpoint: ${endpoint}`,
          code: 'SERVICE_UNAVAILABLE',
          suggestion: 'Make sure the scraping service is running or configure a different endpoint in your environment variables.'
        }), { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      throw fetchError;
    }

        } catch (error: unknown) {
    console.error('❌ Scrape API route error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: (error as Error)?.message || 'Unknown error occurred',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
