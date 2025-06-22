'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrainingProgressCard } from './training-progress-card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainingJob {
  id: string;
  face_model_id: string;
  status: string;
  created_at: string;
  face_model?: {
    name: string;
    user_id: string;
  };
}

interface TrainingProgressListProps {
  className?: string;
  maxItems?: number;
  onJobComplete?: (jobId: string) => void;
  refreshTrigger?: number;
}

export function TrainingProgressList({
  className,
  maxItems = 5,
  onJobComplete,
  refreshTrigger
}: TrainingProgressListProps) {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { user } = useAuth();
  
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  // Use useCallback to prevent fetchJobs from changing on every render
  const fetchJobs = useCallback(async () => {
    if (!user) {
      console.log('TrainingProgressList: No user available, skipping fetch');
      return;
    }

    try {
      setError(null);
      
      // Fetch only basic job metadata - progress is handled by WebSocket
      let query = supabase
        .from('training_jobs')
        .select(`
          id,
          face_model_id,
          status,
          created_at,
          face_models!inner (
            name,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (maxItems) {
        query = query.limit(maxItems);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('TrainingProgressList: Supabase error:', fetchError);
        throw new Error(`Database error: ${fetchError.message} (Code: ${fetchError.code})`);
      }

      console.log('TrainingProgressList: Fetched jobs:', data);
      setJobs(data || []);
    } catch (err) {
      console.error('TrainingProgressList: Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch training jobs';
      setError(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, maxItems]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Refresh jobs when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('TrainingProgressList: Refresh triggered, refetching jobs...');
      fetchJobs();
    }
  }, [refreshTrigger, fetchJobs]);

  // Note: We removed real-time subscriptions in favor of WebSocket-based updates
  // New jobs will be detected when users refresh or navigate back to this page

  const handleJobComplete = useCallback((jobId: string) => {
    onJobComplete?.(jobId);
    // Note: We don't need to refetch here as WebSocket handles progress
  }, [onJobComplete]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    fetchJobs();
  }, [fetchJobs]);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-sm text-muted-foreground">Loading training jobs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-destructive mr-3" />
            <div>
              <h3 className="font-medium">Failed to load training jobs</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No training jobs found</h3>
          <p className="text-sm text-muted-foreground">
            You haven't started any training jobs yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Training Jobs</CardTitle>
          <p className="text-sm text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} • Real-time progress via WebSocket
          </p>
        </CardHeader>
      </Card>

      {/* Job Cards */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <TrainingProgressCard
            key={job.id}
            jobId={job.id}
            userId={user?.id || ''}
            faceModelName={job.face_model?.name || 'Unknown Model'}
            initialStatus={job.status}
            onComplete={() => handleJobComplete(job.id)}
            onError={(error) => console.error('Training job error:', error)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {jobs.length === maxItems && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              // Could implement pagination here
              console.log('Load more jobs');
            }}
          >
            Load More Jobs
          </Button>
        </div>
      )}
    </div>
  );
} 