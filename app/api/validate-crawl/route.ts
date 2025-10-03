import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkFeatureAccess, checkProjectLimit, validateCrawlRequest } from '@/lib/plan-validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, crawlType, requestedFeatures } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user can perform the crawl type
    const crawlAccess = await checkFeatureAccess(
      userId, 
      crawlType === 'single' ? 'single_page_crawl' : 'full_site_crawl'
    )

    if (!crawlAccess.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Access denied',
          message: crawlAccess.error,
          userPlan: crawlAccess.userPlan,
          requiredFeature: crawlType === 'single' ? 'single_page_crawl' : 'full_site_crawl'
        },
        { status: 403 }
      )
    }

    // Check project limit
    const projectLimit = await checkProjectLimit(userId)
    if (!projectLimit.canCreate) {
      return NextResponse.json(
        { 
          error: 'Project limit reached',
          message: projectLimit.error,
          currentCount: projectLimit.currentCount,
          maxProjects: projectLimit.maxProjects
        },
        { status: 403 }
      )
    }

    // Validate requested features
    const featureValidation = await validateCrawlRequest(userId, requestedFeatures || [])
    
    if (!featureValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Feature access denied',
          message: 'Some requested features are not available in your plan',
          deniedFeatures: featureValidation.deniedFeatures,
          allowedFeatures: featureValidation.allowedFeatures,
          errors: featureValidation.errors
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      valid: true,
      userPlan: crawlAccess.userPlan,
      allowedFeatures: featureValidation.allowedFeatures,
      projectLimit: {
        current: projectLimit.currentCount,
        max: projectLimit.maxProjects
      }
    })

  } catch (error) {
    console.error('Error validating crawl request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
