# Admin Alerts System

A complete CRUD system for managing admin alerts that can be displayed to all users on the dashboard.

## Features

### For Admins
- **Create Alerts**: Create different types of alerts (info, warning, error, success, maintenance, announcement, offer)
- **Edit Alerts**: Update existing alerts with new content or settings
- **Delete Alerts**: Remove alerts that are no longer needed
- **Filter & Search**: Filter alerts by status, type, and severity
- **Statistics**: View comprehensive statistics about alerts
- **Target Audience**: Set alerts for specific user groups (all, free, premium, enterprise)
- **Priority System**: Set priority levels (1-10) for alert ordering
- **Auto-expire**: Set alerts to automatically expire at a specific date
- **Action Buttons**: Add call-to-action buttons with custom URLs

### For Users
- **Alert Display**: See relevant alerts at the top of their dashboard
- **Dismissible Alerts**: Dismiss alerts they don't want to see (if enabled by admin)
- **Click Tracking**: Track clicks on action buttons
- **Responsive Design**: Alerts display beautifully on all devices
- **Auto-filtering**: Only see alerts targeted to their user type

## Database Schema

The system uses the `admin_alerts` table with the following structure:

```sql
CREATE TABLE admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('info', 'warning', 'error', 'success', 'maintenance', 'announcement', 'offer')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_global BOOLEAN NOT NULL DEFAULT true,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium', 'enterprise')),
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    action_url TEXT,
    action_text TEXT,
    dismissible BOOLEAN DEFAULT true,
    auto_expire BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0
);
```

## API Endpoints

### Admin Endpoints (Require Admin Role)

#### GET /api/admin/alerts
- Get all alerts with optional filtering
- Query parameters: `status`, `type`, `severity`, `page`, `limit`
- Returns: `{ alerts: AdminAlert[], pagination: {...} }`

#### POST /api/admin/alerts
- Create a new alert
- Body: `CreateAdminAlertRequest`
- Returns: `{ alert: AdminAlert }`

#### GET /api/admin/alerts/[id]
- Get a specific alert
- Returns: `{ alert: AdminAlert }`

#### PUT /api/admin/alerts/[id]
- Update an existing alert
- Body: `UpdateAdminAlertRequest`
- Returns: `{ alert: AdminAlert }`

#### DELETE /api/admin/alerts/[id]
- Delete an alert
- Returns: `{ message: string }`

#### GET /api/admin/alerts/stats
- Get alert statistics
- Returns: `{ stats: AdminAlertStats }`

### Public Endpoints

#### GET /api/alerts
- Get active alerts for users
- Query parameters: `plan` (user plan type)
- Returns: `{ alerts: AdminAlert[] }`

#### POST /api/alerts/click
- Track alert click
- Body: `{ alertId: string }`
- Returns: `{ success: boolean }`

## Usage Examples

### Creating an Alert

```typescript
const newAlert = {
  title: "System Maintenance",
  message: "We will be performing scheduled maintenance on Sunday from 2-4 AM EST.",
  alert_type: "maintenance",
  severity: "medium",
  target_audience: "all",
  priority: 5,
  dismissible: true,
  auto_expire: true,
  end_date: "2024-01-15T00:00:00Z"
}
```

### Creating a Special Offer Alert

```typescript
const offerAlert = {
  title: "50% Off Premium Plan!",
  message: "Get 50% off on our Premium plan for the first 3 months!",
  alert_type: "offer",
  severity: "high",
  target_audience: "free",
  priority: 8,
  action_url: "/pricing",
  action_text: "Claim Offer",
  dismissible: true
}
```

## Components

### AdminAlerts Component
- Location: `app/dashboard/components/tabs/admin-subtabs/AdminAlerts.tsx`
- Features: Full CRUD interface, filtering, statistics, modal forms
- Used in: Admin dashboard tab

### UserAlerts Component
- Location: `app/dashboard/components/UserAlerts.tsx`
- Features: Display alerts to users, dismiss functionality, click tracking
- Used in: Main dashboard (all tabs except admin)

## Setup Instructions

1. **Run the database migration**:
   ```sql
   -- Run the SQL from docs/CREATE-ADMIN-ALERTS-TABLE.sql
   ```

2. **The system is automatically integrated** into the dashboard - no additional setup required.

3. **Access admin alerts**:
   - Go to Dashboard → Admin tab → Alerts subtab
   - Create, edit, and manage alerts

4. **Users will see alerts** automatically on their dashboard

## Alert Types and Colors

- **Info** (ℹ️): Blue - General information
- **Warning** (⚠️): Yellow - Important notices
- **Error** (❌): Red - Critical issues
- **Success** (✅): Green - Positive updates
- **Maintenance** (🔧): Orange - System maintenance
- **Announcement** (📢): Purple - Important announcements
- **Offer** (🎉): Pink - Special offers and promotions

## Best Practices

1. **Use appropriate severity levels**:
   - Critical: System outages, security issues
   - High: Important updates, major changes
   - Medium: Regular maintenance, feature announcements
   - Low: General information, tips

2. **Target the right audience**:
   - All: System-wide announcements
   - Free: Upgrade prompts, feature limitations
   - Premium: Premium feature updates
   - Enterprise: Enterprise-specific information

3. **Set appropriate priorities**:
   - 8-10: Critical alerts that must be seen
   - 5-7: Important but not urgent
   - 1-4: Informational alerts

4. **Use auto-expire** for time-sensitive alerts to keep the system clean

5. **Add action buttons** for alerts that require user interaction

## Security

- All admin endpoints require admin role verification
- User alerts are filtered by user plan type
- Click tracking is anonymous and doesn't store personal data
- Dismissed alerts are stored locally in user's browser
