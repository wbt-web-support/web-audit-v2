-- Add can_use_features column to plans table
-- This column will store JSON array of feature IDs that the plan can use

-- Add the column
ALTER TABLE plans 
ADD COLUMN can_use_features JSONB DEFAULT '[]'::jsonb;

-- Add a comment to explain the column
COMMENT ON COLUMN plans.can_use_features IS 'JSON array of feature IDs that this plan can use. Features are defined in lib/features.ts';

-- Create an index for better performance when querying by features
CREATE INDEX idx_plans_can_use_features ON plans USING GIN (can_use_features);

-- Update existing plans with default features based on plan type
-- Free plans get core features only
UPDATE plans 
SET can_use_features = '["single_page_crawl", "grammar_content_analysis", "image_scan", "link_scanner", "performance_metrics", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Starter';

-- Pro plans get all features except enterprise-only ones (if any)
UPDATE plans 
SET can_use_features = '["single_page_crawl", "full_site_crawl", "hidden_urls_detection", "brand_consistency_check", "grammar_content_analysis", "seo_structure", "stripe_key_detection", "google_tags_audit", "image_scan", "link_scanner", "social_share_preview", "performance_metrics", "ui_ux_quality_check", "technical_fix_recommendations", "accessibility_audit", "mobile_responsiveness", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Growth';

-- Enterprise plans get all features
UPDATE plans 
SET can_use_features = '["single_page_crawl", "full_site_crawl", "hidden_urls_detection", "brand_consistency_check", "grammar_content_analysis", "seo_structure", "stripe_key_detection", "google_tags_audit", "image_scan", "link_scanner", "social_share_preview", "performance_metrics", "ui_ux_quality_check", "technical_fix_recommendations", "accessibility_audit", "mobile_responsiveness", "page_speed_analysis", "broken_links_check"]'::jsonb
WHERE plan_type = 'Scale';

-- Verify the changes
SELECT 
  id, 
  name, 
  plan_type, 
  can_use_features,
  jsonb_array_length(can_use_features) as feature_count
FROM plans 
ORDER BY plan_type, sort_order;
