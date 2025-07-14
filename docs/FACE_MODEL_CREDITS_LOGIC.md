# Face Model Training Credits Logic

## Overview

Face Model training follows a credits-based system where users either consume their included training quota or pay with credits based on their subscription tier.

## Logic Flow

### 1. Included Training Quota Check

Each subscription tier includes a certain number of face model trainings per billing period:

- **Basic Tier**: 1 training included
- **Standard Tier**: 1 training included  
- **Pro Tier**: 3 trainings included

### 2. Credit Cost Calculation

The system follows this logic:

```typescript
if (currentTrainingCount < faceModelTrainingIncluded) {
  // Within included allowance: this training is free
  trainingCost = 0;
} else {
  // Beyond included allowance: charge credits
  trainingCost = FACE_MODEL_TRAINING_COST; // 30 credits
}
```

### 3. Implementation Details

#### Backend (`supabase/functions/training-start/index.ts`)

1. **Subscription Query**: Fetches user's active subscription with billing period information
2. **Stripe Metadata**: Gets `face_model_training_included` from subscription product metadata  
3. **Usage Calculation**: Counts completed training jobs in current billing period
4. **Cost Determination**: Applies logic to determine if training is free or costs credits
5. **Credit Balance Check**: If cost > 0, verifies user has sufficient credits
6. **Credit Deduction**: Deducts credits before starting training (non-refundable)

#### Frontend (`webapp/src/components/face_model/FaceModelUploadDialog.tsx`)

1. **Current Subscription**: Fetches subscription with usage data from `/api/subscription/current`
2. **Remaining Trainings**: Calculates `face_model_training_included - face_model_training_used`
3. **UI Logic**: Shows appropriate messaging and cost information
4. **Credit Guard**: Uses `useCreditGuard` hook to handle authentication and payment flows

## Database Schema

### Key Tables

#### `user_subscriptions`
- `face_model_training_included`: Number of trainings included in plan
- `current_period_start`: Billing period start date
- `current_period_end`: Billing period end date

#### `training_jobs`  
- `user_id`: User who initiated training
- `status`: Job status ('completed' counts toward usage)
- `credits_spent`: Credits deducted for this training
- `created_at`: Used to filter by billing period

#### `credit_costs`
- `FACE_MODEL_TRAINING`: Base cost in credits (30)

## Billing Period Logic

Training usage is calculated per billing period:

```sql
SELECT COUNT(*) 
FROM training_jobs 
WHERE user_id = ? 
  AND status = 'completed'
  AND created_at >= current_period_start
  AND created_at < current_period_end
```

## Error Handling

### Backend Errors
- `403`: No active subscription
- `402`: Insufficient credits for paid training  
- `429`: Concurrent job limit reached
- `400`: Face model already training/ready

### Frontend Validation
- Shows subscription dialog if no active subscription
- Shows credit pack dialog if insufficient credits
- Disables UI if limits reached

## Logging

The system provides detailed logging for debugging:

```typescript
console.log(`Face Model training cost calculation for user ${user_id}:`, {
  baseCost: baseFaceModelTrainingCost,
  finalCost: trainingCost,
  remainingIncluded: faceModelTrainingIncluded - currentTrainingCount,
  isFree: trainingCost === 0
});
```

## Testing Scenarios

### Scenario 1: First Training (Free)
- User has Basic plan (1 training included)
- `currentTrainingCount = 0`
- Result: `trainingCost = 0` (free)

### Scenario 2: Beyond Quota (Paid)
- User has Basic plan (1 training included)
- `currentTrainingCount = 1` 
- Result: `trainingCost = 30` (costs credits)

### Scenario 3: Pro User Multiple Trainings
- User has Pro plan (3 trainings included)
- `currentTrainingCount = 1`
- Result: `trainingCost = 0` (still within quota)

## Common Issues

### 1. Billing Period Mismatch
- **Problem**: `current_period_start` not properly set in subscription
- **Solution**: Fallback to 30 days ago, but subscription webhooks should set this correctly

### 2. Training Count Inconsistency  
- **Problem**: Frontend and backend calculate different usage
- **Solution**: Both use same source (`training_jobs` table with status = 'completed')

### 3. Credit Deduction Timing
- **Problem**: Credits deducted after training fails
- **Solution**: Credits are deducted BEFORE training starts and refunded on failure

## Integration Points

### With Stripe
- Subscription metadata defines `face_model_training_included`
- Billing period dates from Stripe subscription object

### With Credit System
- Uses `spend_user_credits` RPC function
- Records transaction in `credit_usage` table
- Supports refunds via `refund_credits_with_idempotency`

### With UI Components
- `FaceModelUploadDialog` shows cost information
- `FaceModelSelector` displays remaining included trainings
- Credit guard hooks handle payment flows

## Configuration

### Database Values
```sql
-- From credit_costs table
SELECT value FROM credit_costs WHERE type = 'FACE_MODEL_TRAINING'; -- 30

-- From subscriptions table  
SELECT face_model_training_included FROM subscriptions WHERE name = 'basic'; -- 1
```

### Environment Variables
- `TRAINING_API_URL`: Modal API endpoint for training
- `SUPABASE_URL`: Database connection
- `SUPABASE_SERVICE_ROLE_KEY`: Admin database access
- `STRIPE_SECRET_KEY`: Stripe API access 