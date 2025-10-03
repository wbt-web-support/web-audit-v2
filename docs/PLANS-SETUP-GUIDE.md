# Plans & Usage Setup Guide

## 🎯 **Overview**

This guide will help you set up the Plans & Usage management system with database integration and Razorpay pricing.

## 📋 **What's Included**

### ✅ **Database Table**
- `plans` table with comprehensive plan management
- Features JSON storage for flexible plan features
- Limits JSON storage for usage restrictions
- Razorpay integration fields
- RLS (Row Level Security) policies

### ✅ **Admin Panel**
- New "Plans & Usage" tab in admin dashboard
- Full CRUD operations for plans
- Feature management with icons and descriptions
- Plan statistics and analytics

### ✅ **Pricing Integration**
- Database plans take priority over hardcoded plans
- Razorpay fallback for payment processing
- Dynamic pricing display
- Plan type management (Free, Pro, Enterprise)

## 🚀 **Setup Instructions**

### Step 1: Run Database Migration

1. **Open Supabase SQL Editor**
2. **Copy and paste the contents of `scripts/create-plans-table.sql`**
3. **Execute the script**

This will:
- Create the `plans` table
- Set up RLS policies
- Insert default plans (Free, Pro, Enterprise)
- Create necessary indexes

### Step 2: Verify Database Setup

After running the migration, you should see:
- ✅ `plans` table created
- ✅ 3 default plans inserted
- ✅ RLS policies active
- ✅ Indexes created for performance

### Step 3: Test Admin Panel

1. **Login as admin user**
2. **Navigate to Admin Dashboard**
3. **Click on "Plans & Usage" tab**
4. **Verify you can see the default plans**

### Step 4: Test Pricing Section

1. **Visit the home page**
2. **Scroll to pricing section**
3. **Verify plans are loaded from database**
4. **Test plan interactions**

## 📊 **Default Plans**

### 🆓 **Free Plan**
- **Price**: Free
- **Features**: 5 audits/month, Basic SEO, Performance metrics
- **Limits**: 5 audits, 10 pages per audit, 3 projects

### 💼 **Pro Plan**
- **Price**: ₹2,900/month
- **Features**: Unlimited audits, Advanced SEO, API access
- **Limits**: Unlimited audits, 100 pages per audit, API access

### 🏢 **Enterprise Plan**
- **Price**: Custom pricing
- **Features**: Everything in Pro + Dedicated support
- **Limits**: Unlimited everything + Custom integrations

## 🔧 **Admin Features**

### **Plan Management**
- ✅ Create new plans
- ✅ Edit existing plans
- ✅ Delete plans (soft delete)
- ✅ Toggle plan status (active/inactive)
- ✅ Set popular plans

### **Feature Management**
- ✅ Add/remove features
- ✅ Feature icons and descriptions
- ✅ Feature ordering

### **Plan Settings**
- ✅ Plan type (Free, Pro, Enterprise)
- ✅ Pricing and currency
- ✅ Billing intervals
- ✅ Razorpay plan ID linking
- ✅ Usage limits and restrictions

## 🔗 **Razorpay Integration**

### **Plan Linking**
- Link database plans to Razorpay plans
- Use `razorpay_plan_id` field for subscription payments
- Fallback to regular payments if no Razorpay plan ID

### **Payment Flow**
1. User selects plan from pricing section
2. System checks for Razorpay plan ID
3. Creates subscription or order based on plan type
4. Processes payment through Razorpay
5. Updates user subscription status

## 📈 **Usage Tracking**

### **Plan Limits**
- `max_audits_per_month`: Monthly audit limit
- `max_pages_per_audit`: Pages per audit limit
- `max_projects`: Total projects limit
- `retention_days`: Data retention period
- `api_calls_per_month`: API usage limit

### **Feature Flags**
- `priority_support`: Priority customer support
- `api_access`: API access enabled
- `white_label`: White-label reports
- `dedicated_support`: Dedicated account manager
- `custom_integrations`: Custom integrations
- `sla_guarantee`: SLA guarantee
- `phone_support`: 24/7 phone support

## 🎨 **Customization**

### **Plan Colors**
- `gray`: Default color
- `black`: Popular plan color
- `blue`: Pro plan color
- `purple`: Enterprise plan color

### **Feature Icons**
- Use emoji icons for features
- Examples: 📊, 🔍, ⚡, 🔒, 📱, 📧, ♾️, 📈, 🎨, ⚙️, 🚀, 🔌, 📄

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Plans not loading**
   - Check database connection
   - Verify RLS policies
   - Check console for errors

2. **Admin access denied**
   - Verify user has admin role
   - Check role verification system
   - Ensure proper authentication

3. **Payment integration issues**
   - Verify Razorpay configuration
   - Check environment variables
   - Test with Razorpay test keys

### **Database Issues**

1. **Table not found**
   - Run the migration script again
   - Check Supabase connection
   - Verify table permissions

2. **RLS policy errors**
   - Check policy definitions
   - Verify user authentication
   - Test with service role key

## 🎉 **Success Indicators**

After setup, you should see:
- ✅ Plans tab in admin dashboard
- ✅ Default plans visible
- ✅ Pricing section loads from database
- ✅ Plan creation/editing works
- ✅ Feature management works
- ✅ Payment integration works

## 🔄 **Next Steps**

1. **Customize default plans** to match your business needs
2. **Set up Razorpay plans** and link them to database plans
3. **Configure usage limits** based on your requirements
4. **Test payment flows** with test cards
5. **Monitor plan usage** through admin dashboard

The Plans & Usage system is now fully integrated and ready for production use! 🚀
