import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// S3 Client for cleanup operations
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3";

interface CleanupRequest {
  character_id: string;
  user_id: string;
  reason?: string;
}

// Initialize S3 client for cleanup operations
const s3Client = new S3Client({
  region: Deno.env.get('AWS_REGION') || 'us-east-1',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
  },
});

// Delete entire character folder from S3
async function deleteS3CharacterFolder(userId: string, characterId: string): Promise<{ success: boolean; deletedCount: number; errors: any[] }> {
  const bucketName = Deno.env.get('AWS_S3_BUCKET');
  if (!bucketName) {
    console.error('AWS_S3_BUCKET environment variable not set');
    return { success: false, deletedCount: 0, errors: ['AWS_S3_BUCKET not configured'] };
  }
  
  const folderPrefix = `user-images/${userId}/training/${characterId}/`;
  
  try {
    // List all objects in the character folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`No S3 objects found for character folder: ${folderPrefix}`);
      return { success: true, deletedCount: 0, errors: [] };
    }
    
    // Prepare objects for deletion
    const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));
    
    // Delete all objects in the folder
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });
    
    const deleteResponse = await s3Client.send(deleteCommand);
    
    const deletedCount = deleteResponse.Deleted?.length || 0;
    const errors = deleteResponse.Errors || [];
    
    if (deletedCount > 0) {
      console.log(`✅ Deleted ${deletedCount} S3 objects for character: ${characterId}`);
    }
    
    if (errors.length > 0) {
      console.error(`❌ Failed to delete some S3 objects:`, errors);
    }
    
    return { success: errors.length === 0, deletedCount, errors };
    
  } catch (error) {
    console.error(`❌ Error deleting S3 folder for character ${characterId}:`, error);
    return { success: false, deletedCount: 0, errors: [error.message] };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CleanupRequest = await req.json();
    const { character_id, user_id, reason = 'Manual cleanup' } = body;

    // Validate required fields
    if (!character_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: character_id, user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧹 Starting cleanup for character: ${character_id}, reason: ${reason}`);

    const results = {
      character_id,
      user_id,
      reason,
      s3_cleanup: { success: false, deletedCount: 0, errors: [] as any[] },
      images_cleanup: { success: false, deletedCount: 0, error: null },
      character_cleanup: { success: false, error: null },
      training_jobs_cleanup: { success: false, deletedCount: 0, error: null }
    };

    // 1. Delete all images from S3 for this character
    results.s3_cleanup = await deleteS3CharacterFolder(user_id, character_id);

    // 2. Delete all image records from database
    try {
      const { count: imageCount, error: imagesDeleteError } = await supabase
        .from('uploaded_images')
        .delete({ count: 'exact' })
        .eq('character_id', character_id)
        .eq('user_id', user_id);

      if (imagesDeleteError) {
        results.images_cleanup = { success: false, deletedCount: 0, error: imagesDeleteError.message };
        console.error('Failed to delete image records:', imagesDeleteError);
      } else {
        results.images_cleanup = { success: true, deletedCount: imageCount || 0, error: null };
        console.log(`✅ Deleted ${imageCount || 0} image records for character: ${character_id}`);
      }
    } catch (error) {
      results.images_cleanup = { success: false, deletedCount: 0, error: error.message };
      console.error('Error deleting image records:', error);
    }

    // 3. Delete any training jobs for this character
    try {
      const { count: jobCount, error: jobsDeleteError } = await supabase
        .from('training_jobs')
        .delete({ count: 'exact' })
        .eq('character_id', character_id)
        .eq('user_id', user_id);

      if (jobsDeleteError) {
        results.training_jobs_cleanup = { success: false, deletedCount: 0, error: jobsDeleteError.message };
        console.error('Failed to delete training job records:', jobsDeleteError);
      } else {
        results.training_jobs_cleanup = { success: true, deletedCount: jobCount || 0, error: null };
        console.log(`✅ Deleted ${jobCount || 0} training job records for character: ${character_id}`);
      }
    } catch (error) {
      results.training_jobs_cleanup = { success: false, deletedCount: 0, error: error.message };
      console.error('Error deleting training job records:', error);
    }

    // 4. Delete the character record
    try {
      const { error: characterDeleteError } = await supabase
        .from('characters')
        .delete()
        .eq('id', character_id)
        .eq('user_id', user_id);

      if (characterDeleteError) {
        results.character_cleanup = { success: false, error: characterDeleteError.message };
        console.error('Failed to delete character record:', characterDeleteError);
      } else {
        results.character_cleanup = { success: true, error: null };
        console.log(`✅ Deleted character record: ${character_id}`);
      }
    } catch (error) {
      results.character_cleanup = { success: false, error: error.message };
      console.error('Error deleting character record:', error);
    }

    // Determine overall success
    const overallSuccess = results.s3_cleanup.success && 
                          results.images_cleanup.success && 
                          results.character_cleanup.success &&
                          results.training_jobs_cleanup.success;

    console.log(`🧹 Cleanup ${overallSuccess ? 'completed successfully' : 'completed with errors'} for character: ${character_id}`);

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        character_id,
        cleanup_results: results
      }),
      {
        status: overallSuccess ? 200 : 207, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Character cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 