import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    
    // Test basic connection
    const { data, error } = await supabase
      .from('payments')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      paymentsCount: data || 0
    })
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
