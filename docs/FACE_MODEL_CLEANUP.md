# Face Model Cleanup System

## Overview

The face model cleanup system ensures that when face model training fails, all associated resources are properly cleaned up to prevent orphaned data and storage costs.

## Automatic Cleanup

### Training Start Failures

When face model training fails during the initial setup (in `training-start` Edge Function), the system automatically:

1. **Deletes S3 Images**: Removes the entire face model folder (`user-images/{face_model_id}/`) from S3
2. **Deletes Database Images**: Removes all image records associated with the face model
3. **Deletes Face Model**: Removes the face model record from the database
4. **Refunds Credits**: If applicable, refunds spent credits with idempotency protection

### Failure Scenarios Covered

- **Job Creation Failure**: When the training job record cannot be created
- **Modal API Failure**: When the external training service cannot be reached or fails to start

## Manual Cleanup

### Cleanup Edge Function

A dedicated Edge Function (`cleanup-failed-face-model`) is available for manual cleanup operations.

**Endpoint**: `POST /functions/v1/cleanup-failed-face-model`

**Request Body**:
```json
{
  "face_model_id": "uuid-of-face-model",
  "user_id": "uuid-of-user",
  "reason": "Optional reason for cleanup"
}
```

**Response**:
```json
{
  "success": true,
  "face_model_id": "uuid-of-face-model",
  "cleanup_results": {
    "s3_cleanup": {
      "success": true,
      "deletedCount": 10,
      "errors": []
    },
    "images_cleanup": {
      "success": true,
      "deletedCount": 10,
      "error": null
    },
    "face_model_cleanup": {
      "success": true,
      "error": null
    },
    "training_jobs_cleanup": {
      "success": true,
      "deletedCount": 1,
      "error": null
    }
  }
}
```

## Cleanup Operations

### 1. S3 Cleanup

- **Target**: `user-images/{face_model_id}/` folder
- **Method**: Lists all objects with the prefix and deletes them in batch
- **Error Handling**: Continues with other cleanup operations even if S3 cleanup fails

### 2. Database Cleanup

#### Images Table
- Deletes all records where `face_model_id` matches and `user_id` matches
- Returns count of deleted records

#### Training Jobs Table
- Deletes all training job records for the face model
- Ensures no orphaned job records remain

#### Face Models Table
- Deletes the face model record itself
- Final cleanup step

### 3. Credit Refunds

For automatic cleanup during training start failures:
- Uses idempotency protection to prevent duplicate refunds
- Refunds the exact amount spent on training
- Logs refund status for audit purposes

## Error Handling

### Partial Failures

The cleanup system is designed to be resilient:
- Each cleanup operation is independent
- Failures in one operation don't prevent others from executing
- Detailed error reporting for each operation
- Returns HTTP 207 (Multi-Status) for partial successes

### Logging

All cleanup operations are extensively logged:
- Start and completion of cleanup operations
- Success/failure status for each step
- Error details for debugging
- Resource counts (files deleted, records removed)

## Security

### Access Control

- Cleanup functions use service role authentication
- User ID validation ensures users can only clean up their own resources
- Face model ownership verification before deletion

### Idempotency

- Credit refunds use idempotency keys to prevent duplicate processing
- Safe to retry cleanup operations

## Monitoring

### Success Metrics

- Track cleanup success rates
- Monitor S3 deletion counts
- Database record deletion counts

### Failure Alerts

- S3 access failures
- Database constraint violations
- Partial cleanup scenarios

## Usage Examples

### Automatic Cleanup (Built-in)

Automatic cleanup is triggered when:
```typescript
// Training job creation fails
if (insertError) {
  await cleanupFailedFaceModel(supabase, face_model_id, user_id);
}

// Modal API call fails  
catch (modalError) {
  await cleanupFailedFaceModel(supabase, face_model_id, user_id);
}
```

### Manual Cleanup

```bash
# Using curl
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-failed-face-model \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "face_model_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "987fcdeb-51a2-43d7-8f9e-123456789abc",
    "reason": "Training timeout - manual cleanup"
  }'
```

### Frontend Integration

```typescript
// Call cleanup from admin interface or error recovery
const cleanupResponse = await fetch('/api/cleanup-face-model', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    face_model_id: faceModelId,
    user_id: userId,
    reason: 'User requested cleanup'
  })
});
```

## Environment Variables

Required environment variables for cleanup operations:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Best Practices

1. **Monitor Cleanup Operations**: Track success rates and investigate failures
2. **Regular Maintenance**: Periodically check for orphaned resources
3. **Cost Optimization**: Cleanup prevents unnecessary S3 storage costs
4. **Data Integrity**: Ensures consistent state between S3 and database
5. **User Experience**: Prevents confusion from failed face models appearing in UI

## Troubleshooting

### Common Issues

1. **S3 Access Denied**: Check AWS credentials and bucket permissions
2. **Database Constraint Violations**: Verify foreign key relationships
3. **Partial Cleanup**: Review logs to identify specific failure points

### Recovery Steps

1. Check Edge Function logs for detailed error messages
2. Verify environment variables are correctly set
3. Test S3 connectivity and permissions
4. Run manual cleanup for specific face models if needed
5. Contact support for persistent issues

## Related Documentation

- [Face Model Training Flow](./FACE_MODEL_CREDITS_LOGIC.md)
- [S3 Configuration](../webapp/src/lib/s3.ts)
- [Database Schema](../supabase/migrations/) 