# Credit Balance Real-time Updates - Testing Guide

## Overview
This guide explains how to test the improved real-time credit balance updates that were implemented to fix the issue where credit balance wasn't updating immediately when credits were spent during inference or training operations.

## What Was Fixed

### 1. Simplified Real-time Subscription (`useCreditBalanceSimple.ts`)
- **Robust Configuration**: Simplified channel setup to avoid binding mismatches
- **Single Event Source**: Focuses on `user_credits` table for reliability
- **Faster Updates**: Reduced stale time to 5s for quicker refreshes
- **Fallback Polling**: 30-second polling as backup if real-time fails
- **Force Refetch**: Immediately refetches data when changes are detected

### 2. Database Real-time Configuration (`20250928000000_enable_realtime_user_credits.sql`)
- **Replica Identity**: Set to FULL for all credit-related tables
- **Publication Setup**: Explicitly added tables to real-time publication
- **Comprehensive Coverage**: Includes all credit-related tables

### 3. Visual Feedback (`CreditsHeaderRight.tsx`)
- **Loading Indicator**: Shows 🔄 icon when balance is updating
- **Opacity Change**: Dims text during updates for visual feedback

### 4. Optimistic Updates (`useCreditBalanceOptimistic.ts` & `creditOptimisticUpdates.ts`)
- **Immediate Feedback**: Updates UI instantly when credits are spent
- **Error Recovery**: Reverts changes if operations fail
- **Utility Functions**: Reusable functions for optimistic updates

## Testing Steps

### Prerequisites
1. Ensure you have an active subscription
2. Have some credits in your account
3. Open browser developer console to see logging

### Test 1: Real-time Subscription Setup
1. **Open the webapp** and log in
2. **Check console logs** for:
   ```
   📡 Setting up real-time subscription for user [user-id]
   ✅ Real-time subscription established successfully
   ✅ Successfully subscribed to real-time updates
   ```
3. **Verify**: No error messages in console

### Test 2: Inference Credit Spending
1. **Note current credit balance** in header
2. **Start an inference job** (generate images)
3. **Watch for**:
   - Immediate visual feedback (🔄 icon, dimmed text)
   - Console logs: `💳 Credit balance change detected - invalidating cache`
   - Balance updates within seconds
4. **Verify**: Balance decreases by the correct amount

### Test 3: Training Credit Spending
1. **Note current credit balance** in header
2. **Start a training job** (train character)
3. **Watch for**:
   - Immediate visual feedback
   - Console logs showing credit changes
   - Balance updates within seconds
4. **Verify**: Balance decreases by training cost (typically 30 credits)

### Test 4: Connection Recovery
1. **Simulate network issues**:
   - Temporarily disconnect internet
   - Reconnect after 10-15 seconds
2. **Watch console logs** for:
   ```
   ❌ Real-time channel error
   🔄 Attempting to reconnect after channel error...
   ✅ Successfully subscribed to real-time updates
   ```
3. **Test credit spending** after reconnection
4. **Verify**: Updates work normally after reconnection

### Test 5: Multiple Browser Tabs
1. **Open webapp in two browser tabs**
2. **Spend credits in one tab** (inference/training)
3. **Watch the other tab** for balance updates
4. **Verify**: Both tabs show the same updated balance

### Test 6: Credit Pack Purchase
1. **Purchase credit pack** (if available)
2. **Watch for**:
   - Console logs showing credit_pack_purchases changes
   - Balance increase in real-time
3. **Verify**: Balance increases by purchased amount

## Console Logging

The implementation includes comprehensive logging. Look for these patterns:

### Successful Operation
```
📡 Setting up simple real-time subscription for user [user-id]
📡 Subscription status: SUBSCRIBED
✅ Real-time updates active
💳 Credit balance changed - refreshing
```

### Error Recovery
```
❌ Real-time subscription error: [error details]
🔄 Attempting to reconnect real-time subscription...
✅ Successfully subscribed to real-time updates
```

### Optimistic Updates (if implemented in components)
```
💳 Optimistically spending [amount] credits
💳 Optimistic balance update: [old] → [new]
```

## Troubleshooting

### Issue: No real-time updates
**Check**:
1. Console for subscription errors
2. Network connectivity
3. Supabase project configuration

**Solution**: Refresh page to re-establish subscription

### Issue: Slow updates
**Check**:
1. Network latency
2. Database performance
3. Browser performance

**Solution**: Updates should occur within 1-3 seconds

### Issue: Incorrect balance
**Check**:
1. Database consistency
2. Multiple concurrent operations
3. Cache invalidation

**Solution**: Refresh page to get authoritative balance

## Migration Deployment

To deploy the database changes:

```bash
# Apply the real-time configuration migration
supabase db push

# Or if using remote:
supabase db push --linked
```

## Performance Considerations

- **Reduced Stale Time**: Balance refreshes more frequently (10s vs 30s)
- **Multiple Subscriptions**: Listens to 3 tables for comprehensive coverage
- **Automatic Reconnection**: May create temporary additional connections during recovery
- **Optimistic Updates**: Provides immediate feedback without waiting for server response

## Success Criteria

✅ **Credit balance updates within 3 seconds** of spending credits  
✅ **Visual feedback** shows during updates  
✅ **Automatic recovery** from connection issues  
✅ **Consistent behavior** across multiple tabs  
✅ **Comprehensive logging** for debugging  
✅ **No console errors** during normal operation  

## Next Steps

If issues persist:
1. Check Supabase real-time configuration
2. Verify database triggers and publications
3. Monitor network requests in browser dev tools
4. Check for rate limiting or quota issues
