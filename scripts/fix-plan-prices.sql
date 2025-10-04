-- Script to fix plan prices and ensure proper price values
-- This will set default prices for plans that have null or invalid price values

-- Check current plan prices
SELECT '--- Current Plan Prices ---' as status;
SELECT 
    id,
    name,
    plan_type,
    price,
    currency,
    is_active
FROM plans 
ORDER BY plan_type;

-- Fix null or invalid price values
UPDATE plans 
SET price = 0 
WHERE price IS NULL OR price = 0;

-- Set appropriate prices based on plan type (in decimal format)
UPDATE plans 
SET price = 0.00 
WHERE plan_type = 'Starter' AND (price IS NULL OR price = 0);

UPDATE plans 
SET price = 29.99 
WHERE plan_type = 'Growth' AND (price IS NULL OR price = 0);

UPDATE plans 
SET price = 99.99 
WHERE plan_type = 'Scale' AND (price IS NULL OR price = 0);

-- Ensure currency is set
UPDATE plans 
SET currency = 'INR' 
WHERE currency IS NULL OR currency = '';

-- Show updated prices
SELECT '--- Updated Plan Prices ---' as status;
SELECT 
    id,
    name,
    plan_type,
    price,
    currency,
    CASE 
        WHEN price = 0 THEN 'Free'
        WHEN currency = 'INR' THEN '₹' || price::TEXT
        ELSE '$' || price::TEXT
    END as formatted_price,
    is_active
FROM plans 
ORDER BY plan_type;

-- Check for any remaining null values
SELECT '--- Null Value Check ---' as status;
SELECT 
    COUNT(*) as total_plans,
    COUNT(price) as plans_with_price,
    COUNT(*) - COUNT(price) as plans_with_null_price
FROM plans;

SELECT '--- Price Fix Complete ---' as status;
