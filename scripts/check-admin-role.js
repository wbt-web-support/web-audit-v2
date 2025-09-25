/**
 * Script to check and verify admin role in the database
 * Run this with: node scripts/check-admin-role.js
 */

const { createClient } = require('@supabase/supabase-js')

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key'

if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
  console.error('❌ Please set NEXT_PUBLIC_SUPABASE_URL in your .env file')
  process.exit(1)
}

if (!supabaseKey || supabaseKey === 'your-supabase-key') {
  console.error('❌ Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminRole() {
  console.log('🔍 Checking admin roles in database...\n')

  try {
    // Get all users with admin role
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('role', 'admin')

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError)
      return
    }

    console.log('👑 Admin Users Found:', adminUsers.length)
    adminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
      console.log(`     Created: ${new Date(user.created_at).toLocaleString()}`)
    })

    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found!')
      console.log('To make yourself an admin, run this SQL in your Supabase dashboard:')
      console.log(`
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
      `)
    }

    // Get all users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })

    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError)
      return
    }

    console.log(`\n📊 Total Users: ${allUsers.length}`)
    console.log('\n📋 All Users:')
    allUsers.forEach((user, index) => {
      const roleIcon = user.role === 'admin' ? '👑' : user.role === 'moderator' ? '🛡️' : '👤'
      console.log(`  ${index + 1}. ${roleIcon} ${user.email} (${user.role})`)
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkAdminRole()
