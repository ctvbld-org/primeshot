# Face Model Training Flow - Testing Guide

## Overview

This guide provides comprehensive test scenarios to verify the complete face model training flow including credits logic, UI state management, dialog flows, subscription limits, and database updates.

## Prerequisites

Before testing, ensure:

1. **Database Setup**: Pricing tables are seeded with correct data
2. **Stripe Products**: Subscription products are created with proper metadata
3. **Environment Variables**: All required ENV vars are set
4. **Test Users**: Create test users with different subscription tiers

## Test Environment Setup

### Database Verification

```sql
-- Verify pricing tables have correct data
SELECT * FROM subscriptions ORDER BY max_face_models;
SELECT * FROM credit_costs WHERE type = 'FACE_MODEL_TRAINING';
SELECT * FROM credit_packs ORDER BY credits;

-- Verify user subscription setup
SELECT * FROM user_subscriptions WHERE status = 'active';
```

### Stripe Metadata Verification

Check that Stripe products have the correct metadata:
- `face_model_training_included`: 1, 1, 3 (Basic, Standard, Pro)
- `max_face_models`: 1, 3, 8 (Basic, Standard, Pro)

## Test Scenarios

### Scenario 1: Unauthenticated User

**Test Steps:**
1. Load the app without signing in
2. Navigate to face model selector
3. Click "Create Face Model" button

**Expected Results:**
- Shows signin modal
- Saves intent for face model creation
- After signin, processes saved intent based on subscription

**Verification:**
- Check localStorage for saved intent
- Verify signin modal appears
- Verify intent is processed after authentication

### Scenario 2: User Without Subscription

**Test Steps:**
1. Sign in as user without active subscription
2. Click "Create Face Model" button

**Expected Results:**
- Shows subscription dialog
- No face model creation dialog opens

**Verification:**
- Subscription dialog displays subscription tiers
- User can select and purchase subscription

### Scenario 3: Basic User - First Training (Free)

**Test Steps:**
1. Sign in as Basic tier user (1 training included)
2. Verify no previous training jobs exist
3. Click "Create Face Model" button
4. Complete face model creation and training

**Expected Results:**
- Training dialog opens immediately
- Cost shows as "Create" (free)
- Training starts without credit deduction
- `credits_spent = 0` in training_jobs table

**Database Verification:**
```sql
-- Check training job record
SELECT credits_spent, status, created_at 
FROM training_jobs 
WHERE user_id = 'user_id' 
ORDER BY created_at DESC LIMIT 1;

-- Check no credit deduction occurred
SELECT * FROM credit_usage 
WHERE user_id = 'user_id' 
ORDER BY created_at DESC LIMIT 1;
```

### Scenario 4: Basic User - Second Training (Paid)

**Test Steps:**
1. Continue with Basic user who completed first training
2. Ensure user has sufficient credits (30+)
3. Click "Create Face Model" button
4. Complete face model creation and training

**Expected Results:**
- Training dialog opens
- Cost shows as "Create with 30 Credits"
- 30 credits deducted before training starts
- `credits_spent = 30` in training_jobs table

**Database Verification:**
```sql
-- Check credit deduction
SELECT amount, usage_type, description 
FROM credit_usage 
WHERE user_id = 'user_id' 
  AND usage_type = 'face_model_training'
ORDER BY created_at DESC LIMIT 1;

-- Check training job cost
SELECT credits_spent FROM training_jobs 
WHERE user_id = 'user_id' 
ORDER BY created_at DESC LIMIT 1;
```

### Scenario 5: Basic User - Insufficient Credits

**Test Steps:**
1. Set Basic user credit balance below 30
2. User has already used included training
3. Click "Create Face Model" button

**Expected Results:**
- Credit Pack dialog opens immediately
- Shows "Need 30 credits for training" message
- User can purchase credit pack

**Verification:**
- Credit pack dialog displays available packs
- Purchase flow works correctly

### Scenario 6: Face Model Limit Reached - Basic User

**Test Steps:**
1. Basic user already has 1 face model (limit for Basic)
2. Click "Create Face Model" button

**Expected Results:**
- Subscription dialog opens
- Message about upgrading to create more face models

**Verification:**
- Dialog shows upgrade options
- User can upgrade subscription

### Scenario 7: Face Model Limit Reached - Pro User (Highest Tier)

**Test Steps:**
1. Pro user already has 8 face models (limit for Pro)
2. Check face model selector

**Expected Results:**
- "Create Face Model" button shows "Limit Reached"
- Button is disabled
- No dialog opens when clicked

**Verification:**
- Button appears disabled
- No interaction possible

### Scenario 8: Pro User - Multiple Free Trainings

**Test Steps:**
1. Sign in as Pro tier user (3 trainings included)
2. Create first face model
3. Create second face model
4. Create third face model
5. Attempt fourth face model

**Expected Results:**
- First 3 trainings are free (`credits_spent = 0`)
- Fourth training costs 30 credits
- UI shows appropriate cost information

**Database Verification:**
```sql
-- Check training history
SELECT face_model_id, credits_spent, created_at 
FROM training_jobs 
WHERE user_id = 'pro_user_id' 
ORDER BY created_at DESC;

-- Should show: 30, 0, 0, 0 (newest to oldest)
```

### Scenario 9: Billing Period Reset

**Test Steps:**
1. User with used training quota
2. Simulate billing period end (update `current_period_start`)
3. Attempt new training

**Expected Results:**
- Training quota resets for new billing period
- Training is free again (within quota)

**Database Simulation:**
```sql
-- Simulate new billing period
UPDATE user_subscriptions 
SET current_period_start = CURRENT_TIMESTAMP,
    current_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month'
WHERE user_id = 'test_user_id';
```

### Scenario 10: Concurrent Job Limits

**Test Steps:**
1. Start training for first face model
2. Immediately try to start second training
3. Check for concurrent limit enforcement

**Expected Results:**
- Second training blocked with 429 error
- Error message shows concurrent limit reached
- Can start second training after first completes

**Backend Logs:**
Look for: "Concurrent job limit reached for user"

### Scenario 11: Training Failure and Refund

**Test Steps:**
1. Start paid training (30 credits)
2. Simulate training failure in Modal
3. Check credit refund

**Expected Results:**
- Credits are refunded to user
- Refund entry in credit_usage table
- Training job marked as failed

**Database Verification:**
```sql
-- Check refund transaction
SELECT amount, usage_type, description 
FROM credit_usage 
WHERE user_id = 'user_id' 
  AND usage_type = 'refund'
ORDER BY created_at DESC LIMIT 1;
```

## API Testing

### Backend Endpoints

Test the training-start Edge Function:

```bash
# Test with valid request
curl -X POST https://your-project.supabase.co/functions/v1/training-start \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_id", "face_model_id": "test_face_model_id"}'

# Expected responses:
# 200: Training started successfully
# 402: Insufficient credits
# 403: No active subscription
# 429: Concurrent limit reached
```

### Frontend API Routes

Test pricing endpoints:

```bash
# Test face model training cost
# Face model training cost is now accessed directly from database
# Use: SELECT value FROM credit_costs WHERE type = 'FACE_MODEL_TRAINING'

# Test face model limit
curl http://localhost:3000/api/pricing/face-model-limit/basic
curl http://localhost:3000/api/pricing/face-model-limit/pro
```

## UI/UX Testing

### Credit Information Display

Verify correct information is shown:

1. **Face Model Selector Footer**
   - Shows "X included in plan" when user has remaining quota
   - Shows "30 credits" when user needs to pay
   - Shows loading state during data fetch

2. **Training Dialog**
   - Button text reflects cost: "Create" vs "Create with 30 Credits"
   - Subscription error messages are clear
   - Credit insufficiency messages are helpful

3. **Dialog Flows**
   - Signin → Subscription → Credit Pack → Training (proper sequence)
   - Each dialog opens the next when needed
   - User can complete full flow smoothly

### Error Handling

Test error scenarios:

1. **Network Failures**
   - API endpoint errors
   - Database connection issues
   - Stripe API failures

2. **Invalid Data**
   - Corrupted subscription data
   - Missing pricing configuration
   - Invalid face model states

3. **Edge Cases**
   - Clock skew in billing periods
   - Webhook processing delays
   - Race conditions in concurrent requests

## Performance Testing

### Database Query Performance

Monitor query execution times:

```sql
-- Check slow queries
EXPLAIN ANALYZE 
SELECT COUNT(*) FROM training_jobs 
WHERE user_id = 'test_user' 
  AND status = 'completed' 
  AND created_at >= '2024-01-01';
```

### API Response Times

Test API endpoint performance:
- `/api/pricing/*` endpoints should respond < 100ms
- Training start should complete < 2s
- Face model loading should complete < 1s

## Monitoring and Logging

### Key Metrics to Monitor

1. **Training Success Rate**
   - Percentage of trainings that complete successfully
   - Time from start to completion

2. **Credit Deduction Accuracy**
   - Verify credits_spent matches actual cost
   - No double-charging or missed charges

3. **User Flow Completion**
   - Percentage of users who complete training after starting
   - Drop-off points in the flow

### Log Analysis

Key log messages to monitor:

```
Face Model training cost calculation for user {user_id}
Training usage for user {user_id}: {current}/{included}
Concurrent job limit reached for user {user_id}
```

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Clean up test training jobs
DELETE FROM training_jobs WHERE user_id IN ('test_user_1', 'test_user_2');

-- Clean up test credit transactions
DELETE FROM credit_usage WHERE user_id IN ('test_user_1', 'test_user_2');

-- Reset test user subscriptions
UPDATE user_subscriptions 
SET current_period_start = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE user_id IN ('test_user_1', 'test_user_2');
```

## Automated Testing

### Unit Tests

Create tests for:
- Credit calculation logic
- Subscription limit checking
- Dialog flow state management

### Integration Tests

Test complete flows:
- Authentication → Subscription → Training
- Credit purchase → Training
- Limit enforcement

### E2E Tests

Use Playwright or similar to test:
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness

## Conclusion

This testing guide ensures the face model training flow works correctly across all user scenarios and edge cases. Run these tests after any changes to the credits logic, UI components, or database schema. 