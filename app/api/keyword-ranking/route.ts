import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkFeatureAccess } from '@/lib/plan-validation'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Competitor {
  name: string
  rank: number
  url?: string
}

interface KeywordRankingResult {
  keyword: string
  rank: number | null
  position: string | null
  analysis: string
  suggestions: string[]
  strengths: string[]
  improvements: string[]
  competitors: Competitor[]
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords, websiteUrl, userId: bodyUserId } = body

    // Get user from request (prefer body userId, fallback to auth)
    let userId: string | null = bodyUserId || null

    if (!userId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          userId = user.id
        }
      } else {
        // Try to get user from session cookies
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (!authError && user) {
          userId = user.id
        }
      }
    }

    // Require authentication for this endpoint
    if (!userId) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'You must be logged in to use this feature'
        },
        { status: 401 }
      )
    }

    // Check feature access - this is required
    const featureAccess = await checkFeatureAccess(userId, 'ai_keyword_ranking')
    if (!featureAccess.hasAccess) {
      console.error('[API] Access denied for ai_keyword_ranking:', {
        userId,
        userPlan: featureAccess.userPlan,
        hasAccess: featureAccess.hasAccess,
        error: featureAccess.error
      })
      return NextResponse.json(
        {
          error: 'Access denied',
          message: featureAccess.error,
          userPlan: featureAccess.userPlan,
          requiredFeature: 'ai_keyword_ranking'
        },
        { status: 403 }
      )
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    if (keywords.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 keywords allowed' },
        { status: 400 }
      )
    }

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    })

    const keywordsList = keywords.join(', ')
    
    const prompt = `You are an expert SEO analyst specializing in search engine ranking analysis. Analyze the search engine ranking position of a website for specific keywords.

**Website URL:** ${websiteUrl}
**Keywords to analyze:** ${keywordsList}

**Task:**
For each keyword provided, determine the website's current search engine ranking position on Google. Provide a comprehensive analysis including:

1. **Ranking Position:**
   - The estimated ranking position (1-100, or null if not ranking in top 100)
   - The position description (e.g., "Page 1, Position 3", "Page 2, Position 5", "Not ranking in top 100")

2. **Detailed Analysis:**
   - A comprehensive explanation of the ranking situation
   - Why the website might be ranking at this position
   - Factors that could be affecting the ranking (content quality, backlinks, domain authority, page speed, mobile-friendliness, technical SEO, etc.)
   - Competitive analysis if applicable
   - Current market position and opportunities

3. **Current Strengths (List Format):**
   - Identify 3-5 positive aspects that are helping the website rank (or could help if implemented)
   - Examples: "Strong domain authority", "Relevant content structure", "Fast page load speed", "Good mobile optimization", "Quality backlinks"
   - Be specific and actionable

4. **Actionable Suggestions (List Format):**
   - Provide 5-8 specific, actionable suggestions to improve ranking
   - Each suggestion should be clear, implementable, and prioritized
   - Examples: "Optimize title tag to include primary keyword within first 60 characters", "Create high-quality backlinks from authoritative sites in your industry", "Improve page load speed to under 2 seconds", "Add schema markup for better rich snippets", "Create comprehensive content targeting long-tail variations"
   - Focus on practical, step-by-step recommendations

5. **Key Improvements Needed (List Format):**
   - List 3-5 critical areas that need immediate attention
   - Prioritize based on impact and ease of implementation
   - Examples: "Content needs to be more comprehensive and cover topic depth", "Missing internal linking strategy", "Technical SEO issues affecting crawlability", "Lack of keyword optimization in meta tags"
   - Be specific about what needs to change

6. **Top Competitors (List Format):**
   - Identify at least 5 top competitors ranking for this keyword
   - For each competitor, provide:
     - Competitor name (website/company name)
     - Their ranking position (1-100)
     - Their website URL (if known or can be inferred)
   - Focus on real competitors that are actually ranking for this keyword
   - Order competitors by their ranking position (1st, 2nd, 3rd, etc.)
   - Include well-known competitors in the industry/niche

**Important Notes:**
- Base your analysis on current SEO best practices and typical ranking factors
- Consider factors like: content relevance, backlinks, domain authority, page speed, mobile-friendliness, technical SEO, user experience, E-A-T (Expertise, Authoritativeness, Trustworthiness), content freshness, keyword optimization
- If you cannot determine an exact ranking, provide an estimated range or indicate uncertainty
- Be realistic and honest about rankings - not all websites rank for all keywords
- All lists (strengths, suggestions, improvements) should contain specific, actionable items
- Make suggestions practical and implementable
- Prioritize suggestions based on potential impact

**Response Format (JSON only, no markdown):**
{
  "results": [
    {
      "keyword": "keyword1",
      "rank": 5,
      "position": "Page 1, Position 5",
      "analysis": "Detailed comprehensive analysis of the ranking situation for this keyword, explaining why the website ranks at position 5, what factors are contributing to this ranking, competitive landscape, and overall assessment.",
      "suggestions": [
        "Specific actionable suggestion 1",
        "Specific actionable suggestion 2",
        "Specific actionable suggestion 3",
        "Specific actionable suggestion 4",
        "Specific actionable suggestion 5"
      ],
      "strengths": [
        "Strength 1 - specific positive aspect",
        "Strength 2 - specific positive aspect",
        "Strength 3 - specific positive aspect"
      ],
      "improvements": [
        "Critical improvement area 1",
        "Critical improvement area 2",
        "Critical improvement area 3"
      ],
      "competitors": [
        {
          "name": "Competitor Name 1",
          "rank": 1,
          "url": "https://competitor1.com"
        },
        {
          "name": "Competitor Name 2",
          "rank": 2,
          "url": "https://competitor2.com"
        },
        {
          "name": "Competitor Name 3",
          "rank": 3,
          "url": "https://competitor3.com"
        },
        {
          "name": "Competitor Name 4",
          "rank": 4,
          "url": "https://competitor4.com"
        },
        {
          "name": "Competitor Name 5",
          "rank": 5,
          "url": "https://competitor5.com"
        }
      ],
      "timestamp": "ISO timestamp"
    },
    {
      "keyword": "keyword2",
      "rank": null,
      "position": "Not ranking in top 100",
      "analysis": "Detailed comprehensive analysis explaining why the website is not ranking, what factors are preventing visibility, competitive analysis, and what needs to change to achieve ranking.",
      "suggestions": [
        "Specific actionable suggestion 1",
        "Specific actionable suggestion 2",
        "Specific actionable suggestion 3",
        "Specific actionable suggestion 4",
        "Specific actionable suggestion 5"
      ],
      "strengths": [
        "Strength 1 - what could help if implemented",
        "Strength 2 - potential positive aspect",
        "Strength 3 - opportunity area"
      ],
      "improvements": [
        "Critical improvement area 1",
        "Critical improvement area 2",
        "Critical improvement area 3"
      ],
      "competitors": [
        {
          "name": "Competitor Name 1",
          "rank": 1,
          "url": "https://competitor1.com"
        },
        {
          "name": "Competitor Name 2",
          "rank": 2,
          "url": "https://competitor2.com"
        },
        {
          "name": "Competitor Name 3",
          "rank": 3,
          "url": "https://competitor3.com"
        },
        {
          "name": "Competitor Name 4",
          "rank": 4,
          "url": "https://competitor4.com"
        },
        {
          "name": "Competitor Name 5",
          "rank": 5,
          "url": "https://competitor5.com"
        }
      ],
      "timestamp": "ISO timestamp"
    }
  ]
}

**CRITICAL:** 
- Provide ALL fields for each keyword (suggestions, strengths, improvements must be arrays with 3-8 items each)
- Competitors array must contain at least 5 competitors (more if possible)
- Each competitor must have: name, rank (1-100), and url (if available)
- Make all suggestions, strengths, and improvements specific and actionable
- Write in clear, professional language
- Focus on practical, implementable recommendations
- Competitors should be real websites/companies that actually rank for the keyword

Provide only the JSON response, no additional text or explanations. Include all keywords in the results array.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean the response text before parsing
    let cleanedText = text.trim()

    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    cleanedText = cleanedText.trim()

    // Parse the JSON response
    const analysisData = JSON.parse(cleanedText) as { results: KeywordRankingResult[] }

    // Ensure all results have timestamps and default arrays
    const results = analysisData.results.map(result => ({
      ...result,
      timestamp: result.timestamp || new Date().toISOString(),
      suggestions: result.suggestions || [],
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      competitors: result.competitors || []
    }))

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('[API] Error in keyword ranking analysis:', error)
    console.error('[API] Error type:', typeof error)
    console.error('[API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      {
        error: 'Failed to analyze keyword rankings',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

