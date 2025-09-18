# Scraped Pages Database Setup Guide

This guide explains how to set up the `scraped_pages` table and update the `audit_projects` table to store scraping data.

## 📋 Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **RLS Fix**: Run the RLS recursion fix first (see `FIX-RLS-RECURSION.md`)
3. **Audit Projects Table**: Ensure the `audit_projects` table exists

## 🗄️ Database Setup

### Step 1: Create Scraped Pages Table

Run the SQL script in your Supabase SQL Editor:

```sql
-- File: scraped-pages-setup.sql
-- This creates the scraped_pages table with all necessary columns and RLS policies
```

### Step 2: Update Audit Projects Table

Run the SQL script to add summary columns:

```sql
-- File: update-audit-projects-summary.sql
-- This adds summary columns to store scraping statistics
```

## 📊 Table Structure

### `scraped_pages` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `audit_project_id` | UUID | Foreign key to audit_projects |
| `user_id` | UUID | Foreign key to auth.users |
| `url` | TEXT | Page URL |
| `status_code` | INTEGER | HTTP status code |
| `title` | TEXT | Page title |
| `description` | TEXT | Meta description |
| `html_content` | TEXT | Full HTML content |
| `html_content_length` | INTEGER | HTML content length |
| `links_count` | INTEGER | Number of links found |
| `images_count` | INTEGER | Number of images found |
| `meta_tags_count` | INTEGER | Number of meta tags |
| `technologies_count` | INTEGER | Number of technologies detected |
| `technologies` | TEXT[] | Array of technologies |
| `cms_type` | TEXT | CMS type detected |
| `cms_version` | TEXT | CMS version |
| `cms_plugins` | TEXT[] | Array of CMS plugins |
| `is_external` | BOOLEAN | Is external page |
| `response_time` | INTEGER | Response time in ms |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `audit_projects` Table (Updated)

New summary columns added:

| Column | Type | Description |
|--------|------|-------------|
| `total_pages` | INTEGER | Total pages scraped |
| `total_links` | INTEGER | Total links found |
| `total_images` | INTEGER | Total images found |
| `total_meta_tags` | INTEGER | Total meta tags found |
| `technologies_found` | INTEGER | Number of technologies detected |
| `cms_detected` | BOOLEAN | CMS detected flag |
| `total_html_content` | INTEGER | Total HTML content length |
| `average_html_per_page` | INTEGER | Average HTML per page |
| `pages_per_second` | DECIMAL | Scraping speed |
| `total_response_time` | INTEGER | Total response time |
| `scraping_completed_at` | TIMESTAMP | When scraping completed |
| `scraping_data` | JSONB | Full scraping response data |

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on both tables
- **User-based access control** - users can only access their own data
- **Foreign key constraints** ensure data integrity
- **Automatic timestamps** for created_at and updated_at

## 🚀 Usage

### Creating Scraped Pages

```typescript
const { createScrapedPages } = useSupabase()

const pagesData = [
  {
    audit_project_id: 'project-uuid',
    url: 'https://example.com',
    title: 'Example Page',
    html_content: '<html>...</html>',
    // ... other fields
  }
]

const { data, error } = await createScrapedPages(pagesData)
```

### Fetching Scraped Pages

```typescript
const { getScrapedPages } = useSupabase()

const { data, error } = await getScrapedPages('project-uuid')
```

### Updating Audit Project with Summary

```typescript
const { updateAuditProject } = useSupabase()

const summaryData = {
  total_pages: 5,
  total_links: 25,
  total_images: 10,
  // ... other summary fields
  status: 'completed',
  progress: 100
}

const { data, error } = await updateAuditProject('project-uuid', summaryData)
```

## 🔧 Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure you've run the RLS recursion fix
2. **Foreign Key Errors**: Ensure audit_projects table exists
3. **Permission Errors**: Check that user is authenticated

### Debug Steps

1. Check Supabase logs for detailed error messages
2. Verify table structure matches the SQL scripts
3. Test with a simple insert operation first
4. Check RLS policies are correctly configured

## 📈 Performance Considerations

- **Indexes**: Created on frequently queried columns
- **Bulk Operations**: Use `createScrapedPages` for multiple pages
- **JSONB Storage**: Full scraping data stored as JSONB for flexibility
- **Pagination**: Consider pagination for large result sets

## 🎯 Next Steps

1. Run the SQL scripts in Supabase
2. Test the form submission with a real website
3. Check the database for saved data
4. Implement data visualization components
5. Add data export functionality
