import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

