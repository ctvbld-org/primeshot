## Primeshot Inference Pipeline PRD (ComfyUI + comfyui-api on Modal)

### 1) Overview
- **Goal**: Ship a fast, scalable, and cost‑efficient inference pipeline using ComfyUI workflows fronted by comfyui-api, running on Modal with on‑demand GPUs and short keepalive windows.
- **Why**: Leverage ComfyUI’s node ecosystem while gaining production features (stateless jobs, dynamic workflow endpoints, webhooks, S3 outputs) with negligible overhead.
- **Scope**: Inference only (training exists separately). Replace per-request CLI runs with comfyui-api dynamic endpoints.

### 2) Architecture
- **Container (per GPU worker)**
  - ComfyUI server (localhost:8000)
  - comfyui-api server (localhost:9000) → forwards to ComfyUI /prompt
  - Warmup workflow executed on start to pre-load checkpoint + VAE + text encoder
- **Autoscaling & Cost**
  - On-demand container per job; keepalive window ~600–900s to ride bursts
  - Models cached on Modal volume; warmup keeps first job latency low
- **Queue**
  - Supabase Edge Function + DB = source-of-truth queue and scheduler
  - Worker fetches job (or gets invoked), submits to comfyui-api, returns immediately (webhook will finalize)
- **Outputs**
  - S3 bucket: `primeshot-uploads-01`
  - Prefix per job: `user-images/{user_id}/inference/{job_id}`
  - Save both: `orig/*.png` (2K/4K) and `web/*.webp` (1K) directly from workflow

### 3) Naming & Endpoints
- Modal app renamed to `primeshot-inference`
- Class renamed to GPU naming: `H100*.` (GPU="H100", scaledown_window≈600–900)
- Remove `health_check`; add `progress` web endpoint (WebSocket)
- WebSocket URL: `wss://creativebuild--primeshot-inference-progress.modal.run`
- Webhook: `@modal.fastapi_endpoint` (e.g., `/inference/webhook`) 

### 4) Secrets & Config
- Secret: `aws-secret`
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET`
- Secret: `comfyui-api-secret`
  - `COMFY_API_KEY` (for API nodes if needed)
  - `COMFYUI_BASE_URL` (set to `http://127.0.0.1:8000`)
  - Webhook URL (to be added)
- comfyui-api S3 output prefix: `user-images/{user_id}/inference/{job_id}`

### 5) Workflow Strategy
- Use comfyui-api Dynamic Workflow Endpoints to avoid local parameter injection.
- Graph split before upscaler:
  - Pre-upscale branch → Resize to 1K → Save WebP (filename_prefix `web_`)
  - Main branch → Upscale to 2K/4K → Save PNG (filename_prefix `orig_`)
- Warmup workflow must load the specific checkpoint, VAE, and text encoder used by production graph.

### 6) Data Model
- Table: `generated_images`
  - `user_id`, `inference_id`, `original_path`, `web_path`
  - `width`, `height`, `format`, `bytes` (store for each variant or at least for `web_`)
- Webhook handler upserts one row per produced image index, pairing orig/web.

### 7) Job Lifecycle
1. Edge Function/queue picks a pending job and invokes the worker with `{user_id, job_id, params}`
2. Worker posts to comfyui-api dynamic workflow endpoint (async mode) with S3 output + webhook URL
3. comfyui-api forwards to ComfyUI /prompt and tracks via WS/history
4. On completion, comfyui-api writes S3 objects and calls webhook
5. Webhook handler updates DB (`generated_images`, job status) and emits progress/final via WS

### 8) Concurrency & Utilization
- One job at a time per GPU/container for reliability; increase throughput via batch size (within a job) and autoscaling multiple containers.
- Optional later: request coalescing + dynamic batch sizing for compatible requests.

### 9) Tasks
1. Integrate comfyui-api in Modal inference worker (HIGH)
   - Install Node 20, clone `ctvbld/comfyui-api@main`, `npm ci --omit=dev`
   - Configure env via secrets; start comfyui-api (9000) and ComfyUI (8000)
2. Rename inference app/class and expose progress WS (MEDIUM)
   - App → `primeshot-inference`; Class → `H100*.`; remove `health_check`; add `progress` endpoint
3. Define dynamic workflow endpoint with dual outputs (HIGH)
   - Pre-upscale save WebP 1K (`web_`), final PNG 2K/4K (`orig_`); S3 prefixes under job path
4. Warmup workflow configuration (MEDIUM)
   - Pre-load checkpoint, VAE, text encoder on startup; measure latency improvement
5. Webhook for completion + DB write (HIGH)
   - `@modal.fastapi_endpoint` parses comfyui-api callback; upsert `generated_images` with paths + metadata; update job status
6. Queue orchestration wiring (MEDIUM)
   - Keep Supabase Edge Function + DB queue; include `user_id`, `job_id` in requests; one job per container; scaledown ~600–900s
7. Remove legacy CLI execution path (LOW)
   - Replace `comfy run` calls with comfyui-api dynamic endpoint invocation
8. Validation & load testing (MEDIUM)
   - Smoke, error-path, and light load tests; confirm S3 artifacts and DB updates; verify WS progress

### 10) Success Metrics
- P50 time-to-first-image (warm): target under previous CLI run path
- First warm job after cold start: improved via warmup (>X% reduction)
- Correct S3 layout with both variants; webhook correctness (no duplicates, idempotent)
- Stable autoscaling under burst (N concurrent jobs complete without timeouts)

### 11) References
- comfyui-api (dynamic workflow endpoints, S3 outputs, webhooks): [SaladTechnologies/comfyui-api](https://github.com/SaladTechnologies/comfyui-api?tab=readme-ov-file#generating-new-workflow-endpoints)
- Your fork (pin main): [ctvbld/comfyui-api](https://github.com/ctvbld/comfyui-api)


