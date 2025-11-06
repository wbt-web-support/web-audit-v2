import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { checkFeatureAccess } from '@/lib/plan-validation';

// Helper function to validate image URL
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    // Check if it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    // Basic check for image file extensions (optional, as some URLs might not have extensions)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    // If no extension, we'll still allow it (could be a dynamic image URL)
    return true;
  } catch {
    return false;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Rate limiting configuration
// Based on CUSTOM-200K-ANNUAL plan (adjust as needed)
const RATE_LIMIT_CONFIG = {
  maxRequestsPerSecond: 10, // 10 requests per second
  maxRequestsPerMinute: 100, // 100 requests per minute
  windowSizeMs: 1000 // 1 second window
};

// In-memory rate limit tracking (for serverless, consider Redis for production)
interface RateLimitTracker {
  requests: number[];
  minuteRequests: number[];
  lastCleanup: number;
}

let rateLimitTracker: RateLimitTracker = {
  requests: [],
  minuteRequests: [],
  lastCleanup: Date.now()
};

// Clean up old requests periodically
function cleanupRateLimitTracker() {
  const now = Date.now();
  const oneSecondAgo = now - 1000;
  const oneMinuteAgo = now - 60000;
  
  // Clean up requests older than 1 second
  rateLimitTracker.requests = rateLimitTracker.requests.filter(
    timestamp => timestamp > oneSecondAgo
  );
  
  // Clean up requests older than 1 minute
  rateLimitTracker.minuteRequests = rateLimitTracker.minuteRequests.filter(
    timestamp => timestamp > oneMinuteAgo
  );
  
  rateLimitTracker.lastCleanup = now;
}

// Wait for rate limit if needed
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Clean up old requests every 5 seconds
  if (now - rateLimitTracker.lastCleanup > 5000) {
    cleanupRateLimitTracker();
  }
  
  // Check per-second limit
  if (rateLimitTracker.requests.length >= RATE_LIMIT_CONFIG.maxRequestsPerSecond) {
    const oldestRequest = rateLimitTracker.requests[0];
    const waitTime = 1000 - (now - oldestRequest);
    
    if (waitTime > 0) {
      console.log(`⏳ Rate limit: Waiting ${waitTime}ms before next request (${rateLimitTracker.requests.length}/${RATE_LIMIT_CONFIG.maxRequestsPerSecond} requests this second)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      cleanupRateLimitTracker();
    }
  }
  
  // Check per-minute limit
  if (rateLimitTracker.minuteRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    const oldestMinuteRequest = rateLimitTracker.minuteRequests[0];
    const waitTime = 60000 - (now - oldestMinuteRequest);
    
    if (waitTime > 0) {
      console.log(`⏳ Rate limit: Waiting ${Math.ceil(waitTime / 1000)}s before next request (${rateLimitTracker.minuteRequests.length}/${RATE_LIMIT_CONFIG.maxRequestsPerMinute} requests this minute)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      cleanupRateLimitTracker();
    }
  }
  
  // Record this request
  const timestamp = Date.now();
  rateLimitTracker.requests.push(timestamp);
  rateLimitTracker.minuteRequests.push(timestamp);
  
  console.log(`📊 Rate limit: ${rateLimitTracker.requests.length}/${RATE_LIMIT_CONFIG.maxRequestsPerSecond} requests this second, ${rateLimitTracker.minuteRequests.length}/${RATE_LIMIT_CONFIG.maxRequestsPerMinute} requests this minute`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body?.imageUrl) {
      return NextResponse.json({
        error: 'Image URL is required',
        code: 'MISSING_IMAGE_URL'
      }, {
        status: 400
      });
    }

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'MISSING_AUTH'
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
        details: authError?.message || 'Token verification failed'
      }, {
        status: 401
      });
    }

    // Check if user has access to Image_scane feature
    const featureAccess = await checkFeatureAccess(user.id, 'Image_scane');
    
    if (!featureAccess.hasAccess) {
      console.warn('🚫 User attempted to use Image_scane feature without access:', {
        userId: user.id,
        userPlan: featureAccess.userPlan,
        error: featureAccess.error
      });
      
      return NextResponse.json({
        error: 'Feature access denied',
        code: 'FEATURE_ACCESS_DENIED',
        message: featureAccess.error || 'Reverse Image Search is not available in your current plan',
        userPlan: featureAccess.userPlan,
        requiredFeature: 'Image_scane'
      }, {
        status: 403
      });
    }

    // Check if user has credits available
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('image_scan_credits')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('❌ Error fetching user credits:', userDataError);
      return NextResponse.json({
        error: 'Failed to check credits',
        code: 'CREDIT_CHECK_FAILED',
        message: 'Unable to verify available credits'
      }, {
        status: 500
      });
    }

    const currentCredits = userData?.image_scan_credits || 0;
    
    if (currentCredits < 1) {
      console.warn('🚫 User attempted to scan image without credits:', {
        userId: user.id,
        currentCredits
      });
      
      return NextResponse.json({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        message: 'You do not have enough credits to scan images. Please purchase credits to continue.',
        currentCredits: currentCredits,
        requiredCredits: 1
      }, {
        status: 402 // Payment Required
      });
    }

    // Get API configuration
    const apiKey = process.env.OPENWEBNINJA_API_KEY;
    let apiHost = process.env.OPENWEBNINJA_HOST || 'api.openwebninja.com';
    
    // Clean and validate the host URL (remove protocol if present)
    apiHost = apiHost.trim().replace(/^https?:\/\//, '');
    // Remove trailing slash if present
    if (apiHost.endsWith('/')) {
      apiHost = apiHost.slice(0, -1);
    }
    
    // Fix common typo: openwebninjs.com -> openwebninja.com
    if (apiHost.includes('openwebninjs.com')) {
      console.warn('⚠️ Detected typo in hostname, correcting: openwebninjs.com -> openwebninja.com');
      apiHost = apiHost.replace('openwebninjs.com', 'openwebninja.com');
    }
    
    console.log('🔧 OpenWebNinja API Configuration:', {
      host: apiHost,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0
    });

    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenWebNinja API key not configured',
        code: 'API_KEY_NOT_CONFIGURED',
        message: 'Please set OPENWEBNINJA_API_KEY in your environment variables'
      }, {
        status: 500
      });
    }

    // Validate image URL
    if (!body.imageUrl || !isValidImageUrl(body.imageUrl)) {
      return NextResponse.json({
        error: 'Invalid image URL provided',
        code: 'INVALID_IMAGE_URL',
        message: 'Please provide a valid image URL'
      }, {
        status: 400
      });
    }

    // Build query parameters
    const params = new URLSearchParams({
      url: body.imageUrl,
      limit: (body.limit || 20).toString(),
      safe_search: body.safe_search || 'blur'
    });

    const apiUrl = `https://${apiHost}/reverse-image-search/reverse-image-search?${params.toString()}`;

    console.log('🔍 Calling OpenWebNinja API:', {
      apiUrl,
      hasApiKey: !!apiKey,
      host: apiHost,
      imageUrl: body.imageUrl?.substring(0, 50) + '...'
    });

    // Apply rate limiting before making the API call
    await waitForRateLimit();
    
    // Call OpenWebNinja API
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'SaaS-Project/1.0'
        },
        signal: controller.signal
      });
      
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ OpenWebNinja API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          apiUrl
        });

        // Handle rate limit (429) from API
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds
          
          console.warn(`⚠️ Rate limited by OpenWebNinja API. Waiting ${waitTime}ms before retry...`);
          
          return NextResponse.json({
            error: 'Rate limit exceeded',
            message: `OpenWebNinja API rate limit reached. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: waitTime / 1000
          }, {
            status: 429
          });
        }

        // If it's a 500 error, show the actual error
        if (response.status === 500) {
          console.error('OpenWebNinja API 500 Error:', errorText);
          return NextResponse.json({
            error: `OpenWebNinja API Error: ${errorText}`,
            code: 'API_ERROR',
            status: response.status
          }, {
            status: 500
          });
        }

        return NextResponse.json({
          error: `OpenWebNinja API error: ${response.status}`,
          details: errorText,
          code: 'API_ERROR'
        }, {
          status: response.status
        });
      }

      const data = await response.json();

      console.log('✅ OpenWebNinja API response received:', {
        status: data.status,
        resultsCount: data.data?.length || 0
      });

      // Save scan results to database
      let savedImageId = body.imageId;
      
      if (body.imageId) {
        // Update existing image record
        try {
          console.log('💾 Attempting to save scan results to database for image:', body.imageId);
          
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('scraped_images')
            .update({
              open_web_ninja_data: data,
              updated_at: new Date().toISOString()
            })
            .eq('id', body.imageId)
            .select();

          if (updateError) {
            console.error('❌ Error saving scan results to database:', {
              error: updateError,
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint,
              code: updateError.code,
              imageId: body.imageId
            });
            // Try to create a new record if update fails
            savedImageId = null;
          } else {
            console.log('✅ Scan results saved to open_web_ninja_data for image:', {
              imageId: body.imageId,
              updatedRows: updateData?.length || 0,
              hasData: !!data
            });
          }
        } catch (dbError) {
          console.error('❌ Exception saving scan results:', {
            error: dbError,
            message: dbError instanceof Error ? dbError.message : String(dbError),
            imageId: body.imageId
          });
          savedImageId = null;
        }
      }
      
      // If no imageId or update failed, try to find or create image record
      if (!savedImageId && body.imageUrl) {
        try {
          console.log('🔍 Image not in database, attempting to find or create record...');
          
          // First, try to find existing image by URL
          const { data: existingImages, error: findError } = await supabaseAdmin
            .from('scraped_images')
            .select('id')
            .eq('original_url', body.imageUrl)
            .limit(1);
          
          if (!findError && existingImages && existingImages.length > 0) {
            // Found existing image, update it
            savedImageId = existingImages[0].id;
            console.log('📝 Found existing image record, updating:', savedImageId);
            
            const { error: updateError } = await supabaseAdmin
              .from('scraped_images')
              .update({
                open_web_ninja_data: data,
                updated_at: new Date().toISOString()
              })
              .eq('id', savedImageId);
            
            if (updateError) {
              console.error('❌ Error updating existing image:', updateError);
              savedImageId = null;
            } else {
              console.log('✅ Updated existing image with scan results');
            }
          } else {
            // Image not found, but we can't create without scraped_page_id
            console.warn('⚠️ Image not found in database and cannot create without scraped_page_id. Image URL:', body.imageUrl.substring(0, 50));
          }
        } catch (createError) {
          console.error('❌ Exception finding/creating image record:', createError);
        }
      }

      // Deduct credit after successful scan
      const { error: creditDeductError } = await supabaseAdmin
        .from('users')
        .update({
          image_scan_credits: Math.max(0, currentCredits - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (creditDeductError) {
        console.error('❌ Error deducting credit:', creditDeductError);
        // Log error but don't fail the request - scan was successful
        // The credit will be deducted on next check or admin can fix manually
      } else {
        console.log('✅ Credit deducted successfully. Remaining credits:', currentCredits - 1);
      }

      return NextResponse.json({
        success: true,
        data: data,
        imageId: savedImageId || body.imageId || null,
        creditsRemaining: currentCredits - 1,
        creditDeducted: true
      });

    } catch (fetchError) {
      // Clear timeout if still active
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error('❌ Error calling OpenWebNinja API:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        apiUrl,
        code: fetchError instanceof Error && 'code' in fetchError ? (fetchError as any).code : undefined,
        cause: fetchError instanceof Error && 'cause' in fetchError ? (fetchError as any).cause : undefined
      });
      
      // Handle specific error types
      if (fetchError instanceof Error) {
        // Network errors
        if (fetchError.message.includes('fetch')) {
          console.error('Network error:', fetchError.message);
          return NextResponse.json({
            error: 'Network Error',
            message: fetchError.message,
            code: 'NETWORK_ERROR',
            apiUrl
          }, {
            status: 500
          });
        }
        
        // DNS/Network errors
        if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('getaddrinfo')) {
          return NextResponse.json({
            error: 'DNS resolution failed',
            message: `Cannot resolve hostname for ${apiHost}. Please check your OPENWEBNINJA_HOST environment variable.`,
            code: 'DNS_ERROR',
            apiUrl,
            host: apiHost
          }, {
            status: 503
          });
        }
        
        // Connection refused
        if (fetchError.message.includes('ECONNREFUSED')) {
          return NextResponse.json({
            error: 'Connection refused',
            message: 'The reverse image search service refused the connection. The service may be down.',
            code: 'CONNECTION_REFUSED',
            apiUrl
          }, {
            status: 503
          });
        }
        
        // Timeout
        if (fetchError.message.includes('timeout') || fetchError.name === 'AbortError') {
          return NextResponse.json({
            error: 'Request timeout',
            message: 'The reverse image search request timed out. Please try again.',
            code: 'TIMEOUT',
            apiUrl
          }, {
            status: 504
          });
        }
      }

      return NextResponse.json({
        error: 'Failed to call reverse image search API',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        code: 'API_CALL_FAILED',
        apiUrl
      }, {
        status: 500
      });
    }

  } catch (error) {
    console.error('❌ Error in reverse-image-search API route:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'INTERNAL_ERROR'
    }, {
      status: 500
    });
  }
}

