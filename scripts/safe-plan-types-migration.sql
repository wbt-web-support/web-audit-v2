-- Safe migration script to update plan types
-- This script handles existing data carefully to avoid constraint violations

-- First, let's see what we're working with
SELECT 'Current plans before migration:' as status;
SELECT plan_type, name, id FROM plans ORDER BY plan_type, name;

-- Step 1: Temporarily disable the constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_type_check;

-- Step 2: Update existing plan data
UPDATE plans SET plan_type = 'Starter' WHERE plan_type = 'free';
UPDATE plans SET plan_type = 'Growth' WHERE plan_type = 'pro';
UPDATE plans SET plan_type = 'Scale' WHERE plan_type = 'enterprise';

-- Step 3: Handle any existing 'Starter' plans by renaming them first
-- If there are already plans with the new names, we need to handle them
UPDATE plans SET plan_type = 'Starter_Temp' WHERE plan_type = 'Starter' AND name != 'Free';
UPDATE plans SET plan_type = 'Growth_Temp' WHERE plan_type = 'Growth' AND name != 'Pro';
UPDATE plans SET plan_type = 'Scale_Temp' WHERE plan_type = 'Scale' AND name != 'Enterprise';

-- Step 4: Now update the temp plans to the correct names
UPDATE plans SET plan_type = 'Starter' WHERE plan_type = 'Starter_Temp';
UPDATE plans SET plan_type = 'Growth' WHERE plan_type = 'Growth_Temp';
UPDATE plans SET plan_type = 'Scale' WHERE plan_type = 'Scale_Temp';

-- Step 5: Re-add the constraint
ALTER TABLE plans ADD CONSTRAINT plans_plan_type_check CHECK (plan_type IN ('Starter', 'Growth', 'Scale'));

-- Step 6: Update project limits for each plan type
UPDATE plans 
SET max_projects = 1 
WHERE plan_type = 'Starter';

UPDATE plans 
SET max_projects = 10 
WHERE plan_type = 'Growth';

UPDATE plans 
SET max_projects = -1 
WHERE plan_type = 'Scale';

-- Step 7: Update features for each plan type
UPDATE plans 
SET can_use_features = '["single_page_crawl", "grammar_content_analysis", "image_scan", "link_scanner", "performance_metrics", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Starter';

UPDATE plans 
SET can_use_features = '["single_page_crawl", "full_site_crawl", "hidden_urls_detection", "brand_consistency_check", "grammar_content_analysis", "seo_structure", "stripe_key_detection", "google_tags_audit", "image_scan", "link_scanner", "social_share_preview", "performance_metrics", "ui_ux_quality_check", "technical_fix_recommendations", "accessibility_audit", "mobile_responsiveness", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Growth';

UPDATE plans 
SET can_use_features = '["single_page_crawl", "full_site_crawl", "hidden_urls_detection", "brand_consistency_check", "grammar_content_analysis", "seo_structure", "stripe_key_detection", "google_tags_audit", "image_scan", "link_scanner", "social_share_preview", "performance_metrics", "ui_ux_quality_check", "technical_fix_recommendations", "accessibility_audit", "mobile_responsiveness", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Scale';

-- Step 8: Verify the changes
SELECT 'Plans after migration:' as status;
SELECT 
    plan_type,
    name,
    max_projects,
    jsonb_array_length(can_use_features) as feature_count
FROM plans 
ORDER BY sort_order;

-- Migration completed successfully
SELECT 'Plan type migration completed successfully' as status;
