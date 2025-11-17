-- Fix credit_packs sequence out of sync issue
-- This happens when records were inserted with explicit IDs

-- Step 1: Check existing credit packs and their IDs
SELECT id, name, credits, price FROM credit_packs ORDER BY id;

-- Step 2: Check current sequence value
SELECT last_value FROM credit_packs_id_seq;

-- Step 3: THE FIX - Reset the sequence to max ID + 1
-- This ensures the next auto-generated ID won't conflict
SELECT setval('credit_packs_id_seq', COALESCE((SELECT MAX(id) FROM credit_packs), 0) + 1, false);

