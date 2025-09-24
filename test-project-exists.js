// Quick test to check if project exists in database
// Run this with: node test-project-exists.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProject() {
  const projectId = '011408ce-6897-4255-8eb6-9d1ffeccd0a7'
  
  console.log('🔍 Checking if project exists:', projectId)
  
  try {
    // Check if project exists (without user filter first)
    const { data: allProjects, error: allError } = await supabase
      .from('audit_projects')
      .select('id, site_url, user_id, status, created_at')
      .eq('id', projectId)
    
    if (allError) {
      console.error('❌ Error checking project:', allError)
      return
    }
    
    if (allProjects && allProjects.length > 0) {
      console.log('✅ Project found in database:')
      console.log('📊 Project details:', allProjects[0])
    } else {
      console.log('❌ Project not found in database')
    }
    
    // Also check total projects count
    const { count, error: countError } = await supabase
      .from('audit_projects')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log('📊 Total projects in database:', count)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkProject()
