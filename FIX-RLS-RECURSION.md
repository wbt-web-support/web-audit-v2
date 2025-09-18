# Fix RLS Recursion Error

The "infinite recursion detected in policy for relation 'users'" error occurs when RLS policies create circular dependencies. Here's how to fix it:

## 🚨 The Problem

The error happens because:
1. RLS policies are trying to query the `users` table
2. But the `users` table has RLS enabled
3. This creates an infinite loop: policy → query users → check policy → query users → ...

## ✅ Solution

### Step 1: Fix the Users Table RLS Policies

Run this SQL in your Supabase SQL editor:

```sql
-- Copy and paste the contents of fix-rls-recursion.sql
```

This will:
- Remove recursive policies
- Use JWT claims instead of database queries
- Simplify the admin check functions

### Step 2: Create the Audit Projects Table

Run this SQL in your Supabase SQL editor:

```sql
-- Copy and paste the contents of audit-projects-simple.sql
```

This will:
- Create the audit_projects table
- Set up non-recursive RLS policies
- Use JWT claims for admin checks

### Step 3: Test the Fix

1. **Check the console** - The recursion errors should disappear
2. **Try the form** - It should now work without timeout issues
3. **Verify data** - Check that projects are saved to the database

## 🔧 What Changed

### Before (Causing Recursion):
```sql
-- This causes recursion because it queries the users table
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### After (No Recursion):
```sql
-- This uses JWT claims instead of querying the database
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );
```

## 🎯 Key Changes

1. **JWT Claims**: Use `auth.jwt() ->> 'role'` instead of querying the users table
2. **Simplified Functions**: Remove recursive function calls
3. **Direct Checks**: Use direct user ID comparisons instead of role lookups
4. **No Circular Dependencies**: Policies don't reference the same table they protect

## 🚀 Expected Results

After running the fixes:
- ✅ No more recursion errors
- ✅ Form submission works properly
- ✅ Data saves to audit_projects table
- ✅ RLS policies work correctly
- ✅ Admin functions work without recursion

## 🔍 Troubleshooting

### If you still see recursion errors:
1. **Clear browser cache** and refresh
2. **Check Supabase logs** for any remaining policy issues
3. **Verify the SQL scripts** ran successfully
4. **Test with a fresh browser session**

### If the form still doesn't work:
1. **Check console logs** for specific error messages
2. **Verify the audit_projects table** exists in Supabase
3. **Test database connection** in Supabase SQL editor
4. **Check RLS policies** are enabled and working

The recursion issue should be completely resolved after running these fixes!
