import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    
    // Get API configuration from environment variables
    const apiBaseUrl = process.env.SCRAPER_API_BASE_URL || 'http://rkssksgc48wgkckwsco4swog.81.0.220.43.sslip.io'
    const apiKey = process.env.SCRAPER_API_KEY
    
    // Validate required environment variables
    if (!apiKey) {
      console.error('❌ SCRAPER_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'API configuration error: Missing API key' },
        { status: 500 }
      )
    }
    
    // Validate request body
    if (!body.url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      )
    }
    
    // Prepare the request to the external API
    const scrapeEndpoint = `${apiBaseUrl}/scrap`
    
    console.log('🔄 Forwarding scraping request to:', scrapeEndpoint)
    console.log('📊 Request data:', {
      url: body.url,
      mode: body.mode,
      maxPages: body.maxPages,
      extractImagesFlag: body.extractImagesFlag,
      extractLinksFlag: body.extractLinksFlag,
      detectTechnologiesFlag: body.detectTechnologiesFlag
    })
    
    // Make the request to the external API with proper headers
    const response = await fetch(scrapeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': apiKey, // API key is only used server-side
        'User-Agent': 'WebAudit-Server/1.0'
      },
      body: JSON.stringify(body),
      // Add timeout
      signal: AbortSignal.timeout(180000) // 3 minute timeout
    })
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('❌ External API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: `Scraping API error: ${response.status} - ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      )
    }
    
    // Get the response data
    const data = await response.json()
    
    console.log('✅ Scraping request successful')
    
    // Return the data to the client
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Server-side scraping error:', error)
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Scraping request timed out after 3 minutes' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Network error: Unable to connect to scraping service' },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error during scraping' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
