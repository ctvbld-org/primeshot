import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useFaceModelsApi } from '@/lib/api/face-models';
import type { FaceModel } from '@/types/jobs';

interface UseFaceModelOptions {
  orderId?: string;
  autoCreate?: boolean;
}

interface UseFaceModelReturn {
  faceModel: FaceModel | null;
  isLoading: boolean;
  error: string | null;
  createFaceModel: (name?: string) => Promise<FaceModel>;
  updateStatus: (status: FaceModel['status']) => Promise<void>;
  isCreating: boolean;
}

export function useFaceModel(options: UseFaceModelOptions = {}): UseFaceModelReturn {
  const { orderId, autoCreate = false } = options;
  const { user } = useAuth();
  const { createFaceModel: createFaceModelApi, updateFaceModelStatus } = useFaceModelsApi();
  
  const [faceModel, setFaceModel] = useState<FaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFaceModel = useCallback(async (name?: string): Promise<FaceModel> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsCreating(true);
    setError(null);

    try {
      const faceModelName = name || `Training Session ${new Date().toLocaleDateString()}`;
      const response = await createFaceModelApi({
        user_id: user.id,
        name: faceModelName,
      });

      setFaceModel(response.face_model);
      return response.face_model;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create face model';
      setError(message);
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }, [user?.id, createFaceModelApi]);

  const updateStatus = useCallback(async (status: FaceModel['status']): Promise<void> => {
    if (!faceModel?.id) {
      throw new Error('No face model to update');
    }

    try {
      await updateFaceModelStatus(faceModel.id, status);
      setFaceModel(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update face model status';
      setError(message);
      throw new Error(message);
    }
  }, [faceModel?.id, updateFaceModelStatus]);

  // Auto-create face model if enabled and user is available
  useEffect(() => {
    if (autoCreate && user?.id && !faceModel && !isCreating && !isLoading) {
      // Wrap in local async function to avoid adding createFaceModel to deps
      const run = async () => {
        try {
          await createFaceModel();
        } catch (err) {
          console.error('Auto-create face model failed:', err);
        }
      };

      run();
    }
    // We intentionally omit createFaceModel from dependencies to prevent effect loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreate, user?.id, faceModel, isCreating, isLoading]);

  return {
    faceModel,
    isLoading,
    error,
    createFaceModel,
    updateStatus,
    isCreating,
  };
} 