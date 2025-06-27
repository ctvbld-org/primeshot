'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaceModelSelector } from '@/components/create/face_models';
import { RealtimeProvider } from '@/contexts/realtime-context';
import { Card, CardContent, CardHeader, CardTitle } from '@primeshot/common/web/ui/card';
import { Badge } from '@primeshot/common/web/ui/badge';
import { Button } from '@primeshot/common/web/ui/button';
import { Input } from '@primeshot/common/web/ui/input';
import { Label } from '@primeshot/common/web/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useJobsApi } from '@/lib/api/jobs';
import { useFaceModelsApi } from '@/lib/api/face-models';
import { Activity, Zap, Clock, Settings, Play, CheckCircle } from 'lucide-react';
import type { FaceModel } from '@/types/jobs';

export default function TrainingDashboard() {
  const { user } = useAuth();
  const { startTraining } = useJobsApi();
  const { getUserFaceModels } = useFaceModelsApi();
  const [selectedFaceModel, setSelectedFaceModel] = useState<FaceModel | null>(null);
  const [faceModels, setFaceModels] = useState<FaceModel[]>([]);
  const [isLoadingFaceModels, setIsLoadingFaceModels] = useState(true);
  const [isStartingTraining, setIsStartingTraining] = useState(false);
  const [lastStartedJobId, setLastStartedJobId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Memoize the callback to prevent infinite loops in child components
  const handleJobComplete = useCallback((jobId: string) => {
    console.log('Training job completed:', jobId);
    // Clear the last started job if it matches
    if (jobId === lastStartedJobId) {
      setLastStartedJobId(null);
    }
  }, [lastStartedJobId]);

  // Load face models on mount
  useEffect(() => {
    const loadFaceModels = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingFaceModels(true);
        const models = await getUserFaceModels(user.id);
        // For testing: show models that are queued, ready, or currently training
        // Exclude only failed models
        const availableModels = models.filter(model => 
          model.status === 'queued' || model.status === 'ready' || model.status === 'training'
        );
        setFaceModels(availableModels);
        
        // Auto-select the first available model
        if (availableModels.length > 0) {
          setSelectedFaceModel(availableModels[0]);
        }
      } catch (error) {
        console.error('Failed to load face models:', error);
      } finally {
        setIsLoadingFaceModels(false);
      }
    };

    loadFaceModels();
  }, [user?.id, getUserFaceModels]);

  const handleStartTraining = useCallback(async () => {
    if (!selectedFaceModel) {
      console.log('Please select a face model');
      return;
    }

    if (!user?.id) {
      console.log('User not authenticated');
      return;
    }

    setIsStartingTraining(true);
    try {
      const result = await startTraining({
        user_id: user.id,
        face_model_id: selectedFaceModel.id
      });

      console.log(`Training started successfully! Job ID: ${result.job_id}`);

      // Remove model selection from local storage to auto select the newest model
      localStorage.removeItem(`face-model-selection`);
      
      // Store the job ID for tracking
      setLastStartedJobId(result.job_id);
      
      // Trigger refresh of the training list to pick up the new job
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Error starting training:', error);
      alert(`Failed to start training: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStartingTraining(false);
    }
  }, [selectedFaceModel, user?.id, startTraining]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Please sign in to view training jobs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RealtimeProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your face model training jobs in real-time
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              Real-time Updates
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Real-time Progress</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Live</div>
              <p className="text-xs text-muted-foreground">
                Updates streamed directly from Modal training
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ETA Estimation</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Smart</div>
              <p className="text-xs text-muted-foreground">
                Intelligent time estimation based on progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Robust</div>
              <p className="text-xs text-muted-foreground">
                Auto-reconnection and error recovery
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Start Training Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Start New Training
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success message for newly started training */}
            {lastStartedJobId && (
              <div className="flex items-center p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
                <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
                <div>
                  <p className="font-medium">Training Started Successfully!</p>
                  <p className="text-sm">Job ID: {lastStartedJobId} - Progress will appear below</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {isLoadingFaceModels ? (
                <div className="space-y-2">
                  <Label>Loading face models...</Label>
                  <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                </div>
              ) : faceModels.length === 0 ? (
                <div className="space-y-2">
                  <Label>No Queued Face Models</Label>
                  <p className="text-sm text-muted-foreground">
                    You need to upload and process images first to create a face model that's ready for training.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="faceModel">Select Face Model</Label>
                  <select
                    id="faceModel"
                    className="w-full p-2 border border-input bg-background rounded-md"
                    value={selectedFaceModel?.id || ''}
                    onChange={(e) => {
                      const selected = faceModels.find(model => model.id === e.target.value);
                      setSelectedFaceModel(selected || null);
                    }}
                    disabled={isStartingTraining}
                  >
                    <option value="">Select a face model</option>
                    {faceModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleStartTraining}
                disabled={isStartingTraining || !selectedFaceModel || isLoadingFaceModels}
                className="min-w-[120px]"
              >
                {isStartingTraining ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Training
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Face Models */}
        <div>
          <FaceModelSelector refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </RealtimeProvider>
  );
} 