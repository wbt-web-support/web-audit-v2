-- Debug script to identify what's creating plans automatically
-- Run this to see what's happening in your database

-- 1. Check current plans and their creation times
SELECT 'Current plans in database:' as status;
SELECT 
    id,
    name,
    plan_type,
    is_active,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_ago
FROM plans 
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check if there are any database triggers on the plans table
SELECT 'Triggers on plans table:' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'plans';

-- 3. Check if there are any functions that might be creating plans
SELECT 'Functions that might create plans:' as status;
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%plans%' 
   OR routine_definition ILIKE '%INSERT INTO plans%';

-- 4. Check recent activity (if you have audit logs)
SELECT 'Recent plan creation pattern:' as status;
SELECT 
    plan_type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    COUNT(*) / EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as plans_per_second
FROM plans 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY plan_type
ORDER BY last_created DESC;

-- 5. Check if there are any scheduled jobs or cron jobs
SELECT 'Scheduled jobs (if any):' as status;
SELECT 
    jobname,
    schedule,
    command,
    active
FROM pg_cron.job 
WHERE command ILIKE '%plans%';

-- 6. Check for any active connections that might be creating plans
SELECT 'Active connections:' as status;
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    LEFT(query, 100) as current_query
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query ILIKE '%plans%'
ORDER BY query_start DESC;
