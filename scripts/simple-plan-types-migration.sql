-- Simple migration script to update plan types from 'free', 'pro', 'enterprise' to 'Starter', 'Growth', 'Scale'
-- This script ONLY migrates existing data and updates constraints

-- Step 1: Update existing plan data FIRST (before changing constraint)
UPDATE plans SET plan_type = 'Starter' WHERE plan_type = 'free';
UPDATE plans SET plan_type = 'Growth' WHERE plan_type = 'pro';
UPDATE plans SET plan_type = 'Scale' WHERE plan_type = 'enterprise';

-- Step 2: Update the CHECK constraint on the plans table
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_type_check;
ALTER TABLE plans ADD CONSTRAINT plans_plan_type_check CHECK (plan_type IN ('Starter', 'Growth', 'Scale'));

-- Step 3: Update project limits for each plan type
UPDATE plans 
SET max_projects = 1 
WHERE plan_type = 'Starter';

UPDATE plans 
SET max_projects = 10 
WHERE plan_type = 'Growth';

UPDATE plans 
SET max_projects = -1 
WHERE plan_type = 'Scale';

-- Step 4: Update features for each plan type
UPDATE plans 
SET can_use_features = '["single_page_crawl", "grammar_content_analysis", "image_scan", "link_scanner", "performance_metrics", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Starter';

UPDATE plans 
SET can_use_features = '["single_page_crawl", "full_site_crawl", "hidden_urls_detection", "brand_consistency_check", "grammar_content_analysis", "seo_structure", "stripe_key_detection", "google_tags_audit", "image_scan", "link_scanner", "social_share_preview", "performance_metrics", "ui_ux_quality_check", "technical_fix_recommendations", "accessibility_audit", "mobile_responsiveness", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Growth';

UPDATE plans 
SET can_use_features = '["single_page_crawl", "full_site_crawl", "hidden_urls_detection", "brand_consistency_check", "grammar_content_analysis", "seo_structure", "stripe_key_detection", "google_tags_audit", "image_scan", "link_scanner", "social_share_preview", "performance_metrics", "ui_ux_quality_check", "technical_fix_recommendations", "accessibility_audit", "mobile_responsiveness", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Scale';

-- Step 5: Verify the changes
SELECT 
    plan_type,
    name,
    max_projects,
    jsonb_array_length(can_use_features) as feature_count
FROM plans 
ORDER BY sort_order;

-- Migration completed successfully
SELECT 'Plan type migration completed successfully' as status;
