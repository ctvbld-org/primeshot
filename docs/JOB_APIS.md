# Training and Inference Job APIs

This document describes the Supabase Edge Functions for training and inference jobs, designed to offload processing from the Next.js server and provide real-time progress tracking.

## Overview

The job system consists of:
- **Training Jobs**: Face model training with Modal AI-toolkit
- **Inference Jobs**: Image generation with trained face models
- **Real-time Progress**: Using Supabase realtime subscriptions
- **Job Queuing**: For inference when face models aren't ready

## Architecture

```
Frontend -> Supabase Edge Functions -> Modal API -> Database Updates -> Realtime Updates
```

## Edge Functions

### 1. Training Start (`/functions/v1/training-start`)

**Endpoint**: `POST /functions/v1/training-start`

**Purpose**: Start a new face model training job

**Request Body**:
```json
{
  "user_id": "uuid",
  "face_model_id": "uuid", 
  "image_metadata": {
    "urls": ["url1", "url2", ...],
    "total_images": 25
  }
}
```

**Response**:
```json
{
  "job_id": "uuid",
  "modal_job_id": "modal_123456",
  "status": "pending",
  "estimated_duration": 180,
  "message": "Training job started successfully"
}
```

**Features**:
- Validates user ownership of face model
- Prevents duplicate training jobs
- Creates job record with progress tracking
- Triggers mock Modal API call
- Simulates training progress (2-5 minutes based on image count)

### 2. Training Progress (`/functions/v1/training-progress`)

**Endpoint**: `GET /functions/v1/training-progress?job_id=uuid&user_id=uuid`

**Purpose**: Get real-time training job progress

**Response**:
```json
{
  "job_id": "uuid",
  "face_model_id": "uuid",
  "face_model": {
    "id": "uuid",
    "name": "My Face Model",
    "status": "training"
  },
  "status": "processing",
  "progress": 65,
  "modal_job_id": "modal_123456",
  "estimated_duration": 180,
  "elapsed_time": 95,
  "estimated_remaining": 85,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:01:35Z",
  "error_message": null,
  "image_count": 25,
  "is_complete": false
}
```

### 3. Inference Start (`/functions/v1/inference-start`)

**Endpoint**: `POST /functions/v1/inference-start`

**Purpose**: Start a new image generation job

**Request Body**:
```json
{
  "user_id": "uuid",
  "face_model_id": "uuid",
  "style_id": "uuid",
  "prompt": "A professional headshot in corporate style",
  "settings": {
    "strength": 0.8,
    "guidance_scale": 7.5,
    "num_inference_steps": 30
  }
}
```

**Response**:
```json
{
  "job_id": "uuid",
  "modal_job_id": "modal_inf_123456",
  "status": "pending", // or "queued" if face model not ready
  "estimated_duration": 45,
  "message": "Inference job started successfully"
}
```

**Features**:
- Validates face model ownership and style availability
- Queues job if face model isn't ready
- Immediate processing if face model is ready
- Simulates inference progress (30-60 seconds)

### 4. Inference Progress (`/functions/v1/inference-progress`)

**Endpoint**: `GET /functions/v1/inference-progress?job_id=uuid&user_id=uuid`

**Purpose**: Get real-time inference job progress and queue status

**Response**:
```json
{
  "job_id": "uuid",
  "face_model_id": "uuid", 
  "style_id": "uuid",
  "face_model": {
    "id": "uuid",
    "name": "My Face Model",
    "status": "ready"
  },
  "style": {
    "id": "uuid",
    "name": "Professional Portrait",
    "description": "Clean, professional headshot style",
    "thumbnail_url": "https://..."
  },
  "status": "completed",
  "progress": 100,
  "modal_job_id": "modal_inf_123456",
  "estimated_duration": 45,
  "elapsed_time": 42,
  "estimated_remaining": 0,
  "queue_position": 0,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:42Z",
  "error_message": null,
  "result_url": "https://mock-storage.primeshot.ai/results/uuid.jpg",
  "prompt": "A professional headshot in corporate style",
  "settings": {
    "strength": 0.8,
    "guidance_scale": 7.5,
    "num_inference_steps": 30
  },
  "is_complete": true
}
```

## Database Schema

### Training Jobs Table
```sql
CREATE TABLE training_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  face_model_id UUID NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  modal_job_id VARCHAR(255),
  estimated_duration INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  error_message TEXT,
  image_count INTEGER
);
```

### Inference Jobs Table
```sql
CREATE TABLE inference_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  face_model_id UUID NOT NULL,
  style_id UUID NOT NULL,
  status VARCHAR(20) CHECK (status IN ('queued', 'pending', 'processing', 'completed', 'failed')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  modal_job_id VARCHAR(255),
  estimated_duration INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  error_message TEXT,
  result_url VARCHAR(500),
  prompt TEXT,
  settings JSONB
);
```

## Frontend Usage

### TypeScript Types
```typescript
import type {
  TrainingStartRequest,
  TrainingStartResponse,
  InferenceStartRequest,
  InferenceStartResponse
} from '@/types/jobs';
```

### API Client
```typescript
import { useJobsApi } from '@/lib/api/jobs';

const jobsApi = useJobsApi();

// Start training
const trainingResult = await jobsApi.startTraining({
  user_id: 'uuid',
  face_model_id: 'uuid',
  image_metadata: {
    urls: ['url1', 'url2'],
    total_images: 25
  }
});

// Start inference
const inferenceResult = await jobsApi.startInference({
  user_id: 'uuid',
  face_model_id: 'uuid',
  style_id: 'uuid',
  prompt: 'Professional headshot'
});
```

### Real-time Progress Tracking
```typescript
import { useTrainingProgress, useInferenceProgress } from '@/hooks/useJobProgress';

// Training progress with realtime updates
const {
  data: trainingData,
  isLoading,
  error,
  progress,
  isComplete
} = useTrainingProgress(jobId, userId, {
  onComplete: (data) => {
    console.log('Training completed!', data);
  },
  onError: (error) => {
    console.error('Training failed:', error);
  }
});

// Inference progress with queue monitoring
const {
  data: inferenceData,
  progress,
  isComplete
} = useInferenceProgress(jobId, userId);
```

### Job Queue Management
```typescript
import { useJobQueue } from '@/hooks/useJobProgress';

const {
  jobs,
  activeJobs,
  completedJobs,
  queuedJobs,
  processingJobs
} = useJobQueue(userId, 'training');
```

## Job Status Flow

### Training Jobs
1. **pending** → Job created, waiting to start
2. **processing** → Training in progress (0-100% progress)
3. **completed** → Training finished successfully
4. **failed** → Training encountered an error

### Inference Jobs
1. **queued** → Face model not ready, job waiting in queue
2. **pending** → Job ready to start processing
3. **processing** → Inference in progress (0-100% progress)  
4. **completed** → Image generation finished successfully
5. **failed** → Inference encountered an error

## Mock Implementation

All edge functions currently use **mock Modal API calls** with simulated progress:

### Training Simulation
- 9 progress steps from 5% to 100%
- Duration: 2-5 minutes based on image count
- Realistic progress messages (preprocessing, epochs, etc.)

### Inference Simulation  
- 7 progress steps from 10% to 100%
- Duration: 30-60 seconds
- Realistic progress messages (loading models, generating, etc.)

### Mock Result URLs
- Training: Updates face model status to 'ready'
- Inference: Generates mock result URL: `https://mock-storage.primeshot.ai/results/{jobId}.jpg`

## Real-time Features

### Supabase Realtime
- Automatic progress updates via PostgreSQL triggers
- No need for manual polling in most cases
- Fallback polling available if realtime fails

### Progress Polling
- Configurable polling interval (default: 2 seconds)
- Automatic cleanup when job completes
- Timeout protection (default: 5 minutes)

## Error Handling

### Common Error Scenarios
- Face model not found or access denied
- Style not available
- Modal API failures
- Database connection issues
- Authentication failures

### Error Responses
```json
{
  "error": "Face model not found or access denied"
}
```

## Security

### Row Level Security (RLS)
- Users can only access their own jobs
- Service role key required for edge functions
- All database operations are user-scoped

### Authentication
- Requires valid Supabase session
- Bearer token authentication for edge functions
- User ID validation on all operations

## Migration to Real Modal API

When ready to integrate with real Modal API:

1. Replace mock Modal API calls in edge functions
2. Update progress tracking to use Modal webhooks  
3. Replace mock result URLs with real S3 URLs
4. Update error handling for real Modal errors
5. Adjust timing and progress steps based on real performance

## Deployment

### Supabase CLI Commands
```bash
# Deploy edge functions
supabase functions deploy training-start
supabase functions deploy training-progress  
supabase functions deploy inference-start
supabase functions deploy inference-progress

# Apply database migrations
supabase db push

# Test functions locally
supabase functions serve
```

### Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `MODAL_API_KEY`: (Future) Modal API authentication
- `MODAL_API_URL`: (Future) Modal API endpoint 