import { createClient } from '@/lib/supabase/client';
import { useCallback } from 'react';
import type { FaceModel } from '@/types/jobs';

const supabase = createClient();

export interface CreateFaceModelRequest {
  user_id: string;
  name: string;
  thumbnail_url?: string;
}

export interface CreateFaceModelResponse {
  face_model: FaceModel;
}

class FaceModelsApiClient {
  async createFaceModel(request: CreateFaceModelRequest): Promise<CreateFaceModelResponse> {
    const { data: faceModel, error } = await supabase
      .from('face_models')
      .insert({
        user_id: request.user_id,
        name: request.name,
        thumbnail_url: request.thumbnail_url,
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create face model: ${error.message}`);
    }

    return { face_model: faceModel };
  }

  async getUserFaceModels(userId: string): Promise<FaceModel[]> {
    const { data: faceModels, error } = await supabase
      .from('face_models')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted') // Exclude soft-deleted face models
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch face models: ${error.message}`);
    }

    return faceModels || [];
  }

  async getFaceModel(faceModelId: string, userId: string): Promise<FaceModel | null> {
    const { data: faceModel, error } = await supabase
      .from('face_models')
      .select('*')
      .eq('id', faceModelId)
      .eq('user_id', userId)
      .neq('status', 'deleted') // Exclude soft-deleted face models
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch face model: ${error.message}`);
    }

    return faceModel;
  }

  async updateFaceModelStatus(faceModelId: string, status: FaceModel['status']): Promise<void> {
    const { error } = await supabase
      .from('face_models')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', faceModelId);

    if (error) {
      throw new Error(`Failed to update face model status: ${error.message}`);
    }
  }

  async deleteFaceModel(faceModelId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('face_models')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', faceModelId)
      .eq('user_id', userId)
      .neq('status', 'deleted'); // Only soft delete non-deleted models

    if (error) {
      throw new Error(`Failed to soft delete face model: ${error.message}`);
    }
  }
}

// Export singleton instance
export const faceModelsApi = new FaceModelsApiClient();

// Hook for React components
export function useFaceModelsApi() {
  const createFaceModel = useCallback(async (request: CreateFaceModelRequest): Promise<CreateFaceModelResponse> => {
    try {
      return await faceModelsApi.createFaceModel(request);
    } catch (error) {
      console.error('Failed to create face model:', error);
      throw error;
    }
  }, []);

  const getUserFaceModels = useCallback(async (userId: string): Promise<FaceModel[]> => {
    try {
      return await faceModelsApi.getUserFaceModels(userId);
    } catch (error) {
      console.error('Failed to get user face models:', error);
      throw error;
    }
  }, []);

  const getFaceModel = useCallback(async (faceModelId: string, userId: string): Promise<FaceModel | null> => {
    try {
      return await faceModelsApi.getFaceModel(faceModelId, userId);
    } catch (error) {
      console.error('Failed to get face model:', error);
      throw error;
    }
  }, []);

  const updateFaceModelStatus = useCallback(async (faceModelId: string, status: FaceModel['status']): Promise<void> => {
    try {
      return await faceModelsApi.updateFaceModelStatus(faceModelId, status);
    } catch (error) {
      console.error('Failed to update face model status:', error);
      throw error;
    }
  }, []);

  const deleteFaceModel = useCallback(async (faceModelId: string, userId: string): Promise<void> => {
    try {
      return await faceModelsApi.deleteFaceModel(faceModelId, userId);
    } catch (error) {
      console.error('Failed to delete face model:', error);
      throw error;
    }
  }, []);

  return {
    createFaceModel,
    getUserFaceModels,
    getFaceModel,
    updateFaceModelStatus,
    deleteFaceModel,
  };
} 