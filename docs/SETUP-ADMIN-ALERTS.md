# Admin Alerts System Setup Guide

## Quick Setup Instructions

### 1. Run the Database Migration

Execute the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of docs/CREATE-ADMIN-ALERTS-TABLE.sql
-- This will create the table, indexes, triggers, and sample data
```

### 2. Verify the Setup

After running the SQL, you should see:
- ✅ `admin_alerts` table created
- ✅ Indexes created for performance
- ✅ Triggers set up for auto-updating timestamps
- ✅ Sample alerts inserted (if admin users exist)

### 3. Test the System

1. **Access Admin Panel**:
   - Go to Dashboard → Admin tab → Alerts subtab
   - You should see the admin alerts management interface

2. **Create a Test Alert**:
   - Click "Create Alert" button
   - Fill in the form with test data
   - Submit to create your first alert

3. **View User Alerts**:
   - Go to Dashboard (main tab)
   - You should see alerts displayed at the top
   - Test dismissing alerts and clicking action buttons

## Troubleshooting

### If you get "No admin users found" message:
This means there are no users with `role = 'admin'` in your database. To fix:

1. **Make a user admin**:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

2. **Or create an admin user**:
   ```sql
   INSERT INTO users (email, role, first_name, last_name) 
   VALUES ('admin@example.com', 'admin', 'Admin', 'User');
   ```

### If alerts don't show up for users:
1. Check that alerts have `status = 'active'`
2. Verify the `start_date` is not in the future
3. Check that `end_date` is null or in the future
4. Ensure the user's plan matches the `target_audience`

### If you get import errors:
Make sure all API files are using the correct import:
```typescript
import { supabase } from '@/lib/supabase'
// NOT: import { createClient } from '@/lib/supabase'
```

## Sample Alert Types

Here are some example alerts you can create:

### Welcome Alert
- **Type**: Info
- **Severity**: Low
- **Message**: "Welcome to our platform! Start your first audit today."
- **Action**: "Get Started" → `/dashboard`

### Maintenance Alert
- **Type**: Maintenance
- **Severity**: Medium
- **Message**: "Scheduled maintenance on Sunday 2-4 AM EST"
- **Dismissible**: Yes

### Special Offer
- **Type**: Offer
- **Severity**: High
- **Target**: Free users only
- **Message**: "Get 50% off Premium plan for 3 months!"
- **Action**: "Claim Offer" → `/pricing`

### System Update
- **Type**: Announcement
- **Severity**: Low
- **Message**: "New features available! Check out our latest SEO tools."
- **Action**: "Learn More" → `/features`

## API Testing

You can test the API endpoints directly:

### Get Alerts (Admin)
```bash
curl -X GET "http://localhost:3000/api/admin/alerts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User Alerts
```bash
curl -X GET "http://localhost:3000/api/alerts?plan=free"
```

### Create Alert (Admin)
```bash
curl -X POST "http://localhost:3000/api/admin/alerts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Alert",
    "message": "This is a test alert",
    "alert_type": "info",
    "severity": "low"
  }'
```

## Features Overview

### Admin Features:
- ✅ Create, edit, delete alerts
- ✅ Filter by status, type, severity
- ✅ View statistics and analytics
- ✅ Set target audiences (all, free, premium, enterprise)
- ✅ Priority system (1-10)
- ✅ Auto-expire functionality
- ✅ Action buttons with custom URLs

### User Features:
- ✅ See relevant alerts on dashboard
- ✅ Dismiss alerts (if enabled)
- ✅ Click tracking for analytics
- ✅ Responsive design
- ✅ Auto-filtering by user type

The system is now ready to use! 🎉
