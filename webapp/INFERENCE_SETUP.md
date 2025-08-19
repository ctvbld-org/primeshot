# Inference Queue Setup Guide

This guide explains how to set up the inference queue system for real-time progress tracking.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# WebSocket URL for inference progress tracking
NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL=wss://creativebuild--primeshot-inference-progress.modal.run

# CloudFront domain for image serving
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d3el9qajjnmn76.cloudfront.net

# Supabase configuration (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### 1. Database Persistence
- On page load, the system fetches active inference jobs from the database
- Shows both active jobs (queued/running) and recent completed jobs
- No more lost state on page refresh

### 2. Real-time Updates
- **WebSocket (Primary)**: Connects to Modal's WebSocket server for real-time progress
- **Database Subscriptions**: Listens for database changes via Supabase real-time
- **Polling Fallback**: Falls back to database polling if WebSocket is unavailable

### 3. Status Flow
```
Database Status → UI Status
queued         → "Queued..."
pending        → "Generating..." (with progress)
running        → "Generating..." (with progress %)
completed      → Shows actual images
failed         → "Failed" (with error message)
```

## Testing the Setup

### 1. Check Configuration
Open browser console and look for:
```
🔍 Inference Configuration Check
✅ NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL: wss://...
✅ NEXT_PUBLIC_CLOUDFRONT_DOMAIN: d3el9qajjnmn76.cloudfront.net
```

### 2. Test WebSocket Connection
In browser console, run:
```javascript
// Import the debug utility
import('/lib/debug/inference-debug').then(({ testWebSocketConnection }) => {
  testWebSocketConnection('test-job-123');
});
```

### 3. Monitor Inference Jobs
1. Create a new generation
2. Watch console logs for:
   - `📊 Found X active jobs and Y completed jobs`
   - `🔌 Connecting to WebSocket progress for job: xxx`
   - `📈 Progress for job xxx: { progress: 50, status: 'running' }`
   - `✅ Job xxx completed`

## Troubleshooting

### Issue: Thumbnails stuck on "Queued..."
**Cause**: WebSocket URL not configured or Modal server not running
**Solution**: 
1. Check `NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL` is set
2. Verify Modal inference server is deployed and accessible
3. System will fall back to database polling (5-second intervals)

### Issue: Jobs disappear on page reload
**Cause**: Database fetching not working
**Solution**:
1. Check Supabase connection
2. Verify user authentication
3. Check browser console for database errors

### Issue: Images not showing after completion
**Cause**: CloudFront domain not configured or S3 paths incorrect
**Solution**:
1. Check `NEXT_PUBLIC_CLOUDFRONT_DOMAIN` is set
2. Verify S3 bucket and CloudFront distribution are working
3. Check generated_images table has correct paths

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Supabase DB    │    │  Modal Server   │
│                 │    │                  │    │                 │
│ InferenceQueue  │◄──►│ inference_jobs   │    │ WebSocket       │
│ Hook            │    │ generated_images │    │ Progress        │
│                 │    │                  │    │ Server          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         └────── Real-time ───────┴────── WebSocket ──────┘
                Subscriptions              Connection
```

## Files Modified

- `webapp/src/hooks/useInferenceQueue.ts` - Main queue logic
- `webapp/src/lib/api/inference-jobs.ts` - Database API
- `webapp/src/lib/hooks/use-inference-jobs-count.ts` - Count hook (now uses queue)
- `webapp/src/components/home/GalleryPlaceholder.tsx` - UI integration
- `webapp/src/lib/debug/inference-debug.ts` - Debug utilities

## Next Steps

1. Deploy Modal inference server with WebSocket support
2. Set environment variables in production
3. Test with real inference jobs
4. Monitor performance and error rates
