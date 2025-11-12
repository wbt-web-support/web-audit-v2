'use server';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body?.images || !Array.isArray(body.images)) {
      return NextResponse.json({
        error: 'Images array is required',
        code: 'MISSING_IMAGES'
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
    
    // Verify user using anon client
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

    // Validate and clean the image data
    const sanitizeString = (value: string | null | undefined) => {
      if (typeof value !== 'string') return value ?? null;
      return value.replace(/\u0000/g, '');
    };

    interface CleanedImage {
      scraped_page_id: string;
      audit_project_id: string | null;
      user_id: string;
      original_url: string;
      alt_text: string | null;
      title_text: string | null;
      width: number | null;
      height: number | null;
      type: string | null;
      size_bytes: number | null;
      extra_metadata: string | null;
    }

    const cleanedImages: CleanedImage[] = body.images.map((image: any) => ({
      scraped_page_id: image.scraped_page_id,
      audit_project_id: image.audit_project_id,
      user_id: user.id,
      original_url: sanitizeString(image.original_url) || '',
      alt_text: sanitizeString(image.alt_text),
      title_text: sanitizeString(image.title_text),
      width: image.width ?? null,
      height: image.height ?? null,
      type: sanitizeString(image.type),
      size_bytes: image.size_bytes ?? null,
      // scan_results column removed - scan results are stored in open_web_ninja_data column
      extra_metadata: image.extra_metadata ? JSON.stringify(image.extra_metadata) : null,
    }));

    // Validate required fields
    const validationErrors: string[] = [];
    cleanedImages.forEach((image: CleanedImage, index: number) => {
      if (!image.scraped_page_id) {
        validationErrors.push(`Image ${index}: Missing scraped_page_id`);
      }
      if (!image.original_url) {
        validationErrors.push(`Image ${index}: Missing original_url`);
      }
      if (!image.user_id) {
        validationErrors.push(`Image ${index}: Missing user_id`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      }, {
        status: 400
      });
    }

    // Insert images in batches to avoid overwhelming the database
    const batchSize = 100;
    const allResults: any[] = [];
    let hasError = false;
    let lastError: any = null;

    for (let i = 0; i < cleanedImages.length; i += batchSize) {
      const batch = cleanedImages.slice(i, i + batchSize);
      try {
        const { data, error } = await supabaseAdmin
          .from('scraped_images')
          .insert(batch)
          .select();

        if (error) {
          console.error(`❌ Error inserting image batch ${i / batchSize + 1}:`, {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            batchSize: batch.length,
            batchIndex: i,
            sampleImage: batch[0]
          });
          hasError = true;
          lastError = error;
          // Continue with next batch even if one fails
        } else if (data) {
          allResults.push(...data);
        }
      } catch (batchError) {
        console.error(`❌ Exception inserting image batch ${i / batchSize + 1}:`, batchError);
        hasError = true;
        lastError = batchError;
      }
    }

    if (hasError && allResults.length === 0) {
      return NextResponse.json({
        error: 'Failed to insert images',
        details: lastError,
        code: 'INSERT_FAILED'
      }, {
        status: 500
      });
    }

    return NextResponse.json({
      success: true,
      data: allResults,
      inserted: allResults.length,
      total: cleanedImages.length,
      error: hasError ? lastError : null
    });

  } catch (error) {
    console.error('❌ Error in scraped-images API route:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'INTERNAL_ERROR'
    }, {
      status: 500
    });
  }
}

