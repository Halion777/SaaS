-- ============================================
-- CLEANUP DUPLICATE PAYMENT RECORDS
-- ============================================
-- This removes duplicate payment records created before the webhook fix
-- Run this ONCE to clean up existing duplicates

-- Step 1: Delete duplicate payment records for the same invoice
-- Keep only the record with stripe_invoice_id (from invoice.payment_succeeded)
-- Delete the one without stripe_invoice_id (from checkout.session.completed)
DELETE FROM payment_records
WHERE id IN (
  SELECT pr1.id
  FROM payment_records pr1
  INNER JOIN payment_records pr2 
    ON pr1.user_id = pr2.user_id
    AND pr1.subscription_id = pr2.subscription_id
    AND pr1.amount = pr2.amount
    AND DATE(pr1.paid_at) = DATE(pr2.paid_at)
    AND pr1.id != pr2.id
  WHERE pr1.stripe_invoice_id IS NULL
    AND pr2.stripe_invoice_id IS NOT NULL
);

-- Step 2: For any remaining duplicates with same stripe_invoice_id, keep only the oldest
DELETE FROM payment_records
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY stripe_invoice_id 
             ORDER BY created_at ASC
           ) AS rn
    FROM payment_records
    WHERE stripe_invoice_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Step 3: Show summary after cleanup
SELECT 
  'Cleanup Complete' as status,
  COUNT(*) as total_remaining_payments,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(amount) as total_amount
FROM payment_records;

-- Step 4: Check if any duplicates remain (should return 0 rows)
SELECT 
  user_id,
  subscription_id,
  amount,
  DATE(paid_at) as payment_date,
  COUNT(*) as count
FROM payment_records
GROUP BY user_id, subscription_id, amount, DATE(paid_at)
HAVING COUNT(*) > 1;

