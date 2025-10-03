-- Migration script to update plan types from 'free', 'pro', 'enterprise' to 'Starter', 'Growth', 'Scale'
-- This script handles all the necessary changes in one place

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

-- Step 5: Insert default plans if they don't exist (only if no plans exist at all)
INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_popular, color, sort_order) 
SELECT 'Starter Plan', 'Perfect for personal projects and small websites', 'Starter', 0, 'INR', 'monthly', 
       '[{"name": "Basic Audit", "description": "Single page analysis", "icon": "search"}]'::jsonb,
       '{"max_pages": 1, "max_crawls_per_month": 10}'::jsonb,
       false, 'green', 1
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type = 'Starter' AND is_active = true);

INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_popular, color, sort_order) 
SELECT 'Growth Plan', 'Ideal for growing businesses and agencies', 'Growth', 290000, 'INR', 'monthly',
       '[{"name": "Full Site Audit", "description": "Complete website analysis", "icon": "globe"}]'::jsonb,
       '{"max_pages": 100, "max_crawls_per_month": 100}'::jsonb,
       true, 'blue', 2
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type = 'Growth' AND is_active = true);

INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_popular, color, sort_order) 
SELECT 'Scale Plan', 'For large organizations with specific needs', 'Scale', 0, 'INR', 'monthly',
       '[{"name": "Enterprise Features", "description": "Advanced analytics and custom solutions", "icon": "building"}]'::jsonb,
       '{"max_pages": -1, "max_crawls_per_month": -1}'::jsonb,
       false, 'purple', 3
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE plan_type = 'Scale' AND is_active = true);

-- Step 6: Verify the changes
SELECT 
    plan_type,
    name,
    max_projects,
    jsonb_array_length(can_use_features) as feature_count
FROM plans 
ORDER BY sort_order;

-- Migration completed successfully
SELECT 'Plan type migration completed successfully' as status;
