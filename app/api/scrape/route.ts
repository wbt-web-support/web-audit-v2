'use server';

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

    // Get API configuration from environment variables
    let apiBaseUrl = process.env.SCRAPER_API_BASE_URL || 'http://localhost:3001';
    
    // Clean the URL by removing any leading '=' characters
    apiBaseUrl = apiBaseUrl.replace(/^=+/, '');
    
    const apiKey = process.env.SCRAPER_API_KEY;
    const endpoint = `${apiBaseUrl}/scrap`;
    
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
