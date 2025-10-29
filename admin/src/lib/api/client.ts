/**
 * API client utilities for admin
 * 
 * Note: API utilities (getApiUrl, apiRequest) have been moved to @primeshot/common
 * Import them from '@primeshot/common' instead of this file.
 * 
 * This file is kept for backwards compatibility but will be removed in the future.
 */

// Re-export from common for backwards compatibility
export { getApiUrl, apiRequest } from '@primeshot/common'

// Re-export AWS types from their new location
export type { AWSCostData, CostMetrics, S3Metrics } from '@/types/aws'

