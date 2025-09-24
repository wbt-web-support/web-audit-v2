// Test script to verify database request for project 011408ce-6897-4255-8eb6-9d1ffeccd0a7
// This simulates the exact request made by the AnalysisTab component

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProjectRequest() {
  const projectId = '011408ce-6897-4255-8eb6-9d1ffeccd0a7'
  
  console.log('🔍 Testing database request for project:', projectId)
  console.log('📊 Query: SELECT * FROM audit_projects WHERE id = ? AND user_id = ?')
  
  try {
    // First, get the current user (you'll need to be authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError?.message || 'No user found')
      console.log('💡 You need to be logged in to test this request')
      return
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Make the exact same request as AnalysisTab
    const { data, error } = await supabase
      .from('audit_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      console.error('❌ Database request failed:', error)
      console.log('📊 Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Handle specific error cases (same as in AnalysisTab)
      if (error.message?.includes('No rows found') || error.message?.includes('not found')) {
        console.log('🔍 Analysis: Project not found or user does not have access')
      } else if (error.message?.includes('permission denied') || error.message?.includes('access denied')) {
        console.log('🔍 Analysis: Permission denied')
      } else {
        console.log('🔍 Analysis: Other database error')
      }
    } else if (data) {
      console.log('✅ Project found:', {
        id: data.id,
        site_url: data.site_url,
        status: data.status,
        created_at: data.created_at,
        user_id: data.user_id
      })
      console.log('📊 Full project data keys:', Object.keys(data))
    } else {
      console.log('❌ No data returned (unexpected)')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testProjectRequest()
