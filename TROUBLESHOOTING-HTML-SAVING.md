# 🔧 Troubleshooting HTML Content Saving Issue

## 🚨 **Problem**: `all_pages_html` column is not saving data

## 🔍 **Step-by-Step Diagnosis**

### **Step 1: Check Database Column Exists**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this query to check if column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'audit_projects' 
   AND column_name = 'all_pages_html';
   ```

4. **If no results**: The column doesn't exist
5. **If results show**: The column exists, check data type

### **Step 2: Add Missing Column (if needed)**

If the column doesn't exist, run this SQL:
```sql
ALTER TABLE audit_projects ADD COLUMN all_pages_html JSONB;
```

### **Step 3: Test the Fix**

1. **Run a scraping operation**
2. **Check browser console for these messages:**
   - `🔍 DEBUG: Summary data being sent to database:`
   - `✅ Verification - All pages HTML in database:`
   - `✅ HTML content successfully saved in all_pages_html column`

### **Step 4: Verify Data is Saved**

Run this SQL to check if data is actually saved:
```sql
SELECT 
  id, 
  site_url, 
  all_pages_html IS NOT NULL as has_all_pages_html,
  jsonb_array_length(all_pages_html) as html_pages_count,
  scraping_data->'all_pages_html' IS NOT NULL as has_backup_html
FROM audit_projects 
WHERE id = 'your-project-id-here';
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Column Doesn't Exist**
- **Error**: `column "all_pages_html" does not exist`
- **Solution**: Run the ALTER TABLE command above

### **Issue 2: Permission Denied**
- **Error**: `permission denied for table audit_projects`
- **Solution**: Use service role key or check RLS policies

### **Issue 3: Data Type Mismatch**
- **Error**: `invalid input syntax for type jsonb`
- **Solution**: Ensure the data is properly formatted JSON

### **Issue 4: Size Limit Exceeded**
- **Error**: `value too long for type character varying`
- **Solution**: The HTML content might be too large for the column

## 🔍 **Debugging Steps**

### **Check Console Logs**
Look for these specific messages in browser console:

1. **Data Preparation**:
   ```
   🔍 Processing page for all_pages_html: { url: "...", hasHtml: true, htmlLength: 12345 }
   📊 All pages HTML data prepared: { totalPages: 3, pagesWithHtml: 3, totalHtmlLength: 50000 }
   ```

2. **Database Update**:
   ```
   🔍 DEBUG: Summary data being sent to database: { hasAllPagesHtml: true, allPagesHtmlLength: 3 }
   ```

3. **Verification**:
   ```
   ✅ Verification - All pages HTML in database: { hasAllPagesHtml: true, allPagesHtmlLength: 3 }
   ✅ HTML content successfully saved in all_pages_html column
   ```

### **If HTML is Not Saved**
Check these fallback locations:
- `scraping_data.all_pages_html` (backup location)
- `scraped_pages.html_content` (individual pages)

## 🚀 **Quick Fix Commands**

### **Add Column (if missing)**:
```sql
ALTER TABLE audit_projects ADD COLUMN all_pages_html JSONB;
```

### **Check Column Exists**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'audit_projects' AND column_name = 'all_pages_html';
```

### **Check Data is Saved**:
```sql
SELECT id, site_url, 
       all_pages_html IS NOT NULL as has_html,
       jsonb_array_length(all_pages_html) as page_count
FROM audit_projects 
ORDER BY created_at DESC LIMIT 5;
```

## 📞 **Still Having Issues?**

1. **Check Supabase logs** in your dashboard
2. **Verify RLS policies** allow updates to audit_projects
3. **Check if you're using the correct user ID** in the update
4. **Ensure the project exists** and belongs to the current user

## ✅ **Success Indicators**

When working correctly, you should see:
- ✅ Console logs showing HTML data being prepared
- ✅ Database update successful without errors
- ✅ Verification showing HTML content saved
- ✅ Data visible in Supabase dashboard
