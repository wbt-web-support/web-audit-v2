# Audit Projects Setup Guide

This guide will help you set up the audit-projects table and CRUD operations for your web audit application.

## Database Setup

### Step 1: Run the Database Script

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `audit-projects-setup.sql` into the editor
4. Click "Run" to execute the script

This will create:
- `audit_projects` table with proper schema
- Row Level Security (RLS) policies
- Helper functions for CRUD operations
- Indexes for better performance

### Step 2: Verify Table Creation

After running the script, you can verify the table was created by running this query in the SQL Editor:

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'audit_projects';
```

## Features Implemented

### 1. Database Schema

The `audit_projects` table includes:
- **Basic Info**: `id`, `user_id`, `site_url`, `page_type`
- **Form Options**: `brand_consistency`, `hidden_urls`, `keys_check`
- **Data Storage**: `brand_data` (JSONB), `hidden_urls_data` (JSONB)
- **Status Tracking**: `status`, `progress`, `score`, `issues_count`
- **Timestamps**: `created_at`, `updated_at`, `last_audit_at`

### 2. Row Level Security (RLS)

Security policies ensure:
- Users can only access their own audit projects
- Admins can access all audit projects
- Proper CRUD permissions for each user role

### 3. CRUD Operations

The following operations are available in `SupabaseContext`:

#### Create Audit Project
```typescript
const { data, error } = await createAuditProject({
  site_url: 'https://example.com',
  page_type: 'single',
  brand_consistency: true,
  hidden_urls: false,
  keys_check: true,
  brand_data: { companyName: 'Example Corp' },
  hidden_urls_data: null,
  status: 'pending',
  progress: 0,
  score: 0,
  issues_count: 0
})
```

#### Get User's Audit Projects
```typescript
const { data, error } = await getAuditProjects()
```

#### Update Audit Project
```typescript
const { data, error } = await updateAuditProject(projectId, {
  status: 'completed',
  progress: 100,
  score: 85
})
```

#### Delete Audit Project
```typescript
const { error } = await deleteAuditProject(projectId)
```

### 4. Form Integration

The form in `DashboardOverview.tsx` now:
- Saves form data to the database on submission
- Shows loading state during submission
- Resets form after successful submission
- Displays success/error messages

## Usage

### 1. Creating an Audit Project

When a user submits the form:
1. Form data is validated
2. Data is sent to `createAuditProject()`
3. Project is saved to `audit_projects` table
4. Form is reset and success message is shown

### 2. Data Structure

The form data is stored as:
- **Basic fields**: Direct column mapping
- **Brand data**: JSONB object with company information
- **Hidden URLs**: JSONB array of URL objects
- **Status tracking**: Automatic status and progress management

### 3. Security

- All operations are protected by RLS policies
- Users can only access their own projects
- Admins have full access to all projects
- All database functions use `auth.uid()` for user identification

## Testing

### 1. Test Form Submission

1. Fill out the form in the dashboard
2. Submit the form
3. Check the browser console for success/error messages
4. Verify data appears in the Supabase dashboard

### 2. Test CRUD Operations

You can test the CRUD operations directly in the browser console:

```javascript
// Get the Supabase context
const { createAuditProject, getAuditProjects } = useSupabase()

// Create a test project
const result = await createAuditProject({
  site_url: 'https://test.com',
  page_type: 'single',
  brand_consistency: false,
  hidden_urls: false,
  keys_check: false,
  brand_data: null,
  hidden_urls_data: null,
  status: 'pending',
  progress: 0,
  score: 0,
  issues_count: 0
})

// Get all projects
const projects = await getAuditProjects()
```

## Troubleshooting

### Common Issues

1. **Table doesn't exist**: Make sure you ran the SQL script in Supabase
2. **Permission denied**: Check RLS policies are properly set up
3. **Form not submitting**: Check browser console for errors
4. **Data not saving**: Verify user is authenticated

### Debug Steps

1. Check browser console for errors
2. Verify user authentication in Supabase dashboard
3. Test database connection in Supabase SQL editor
4. Check RLS policies are enabled and correct

## Next Steps

1. **Display Projects**: Update the dashboard to show user's audit projects
2. **Project Management**: Add edit/delete functionality for projects
3. **Status Updates**: Implement real-time status updates
4. **Admin Panel**: Add admin interface for managing all projects

## File Structure

```
├── audit-projects-setup.sql          # Database setup script
├── contexts/SupabaseContext.tsx     # Updated with CRUD operations
├── app/dashboard/components/tabs/
│   └── DashboardOverview.tsx        # Updated form handler
└── AUDIT-PROJECTS-SETUP.md          # This guide
```

The implementation is now complete and ready for use!
