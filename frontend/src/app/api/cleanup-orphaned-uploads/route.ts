import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all completed or failed upload sessions that haven't been cleaned up
    const { data: orphanedSessions, error: fetchError } = await supabase
      .from('upload_sessions')
      .select('id, status, created_at, file_name')
      .eq('user_id', user.id)
      .in('status', ['completed', 'failed']);

    if (fetchError) {
      console.error('Error fetching orphaned sessions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch orphaned sessions' }, { status: 500 });
    }

    let cleanedSessions = 0;
    let cleanedChunks = 0;
    const errors: string[] = [];

    if (orphanedSessions && orphanedSessions.length > 0) {
      console.log(`Found ${orphanedSessions.length} orphaned sessions for user ${user.id}`);
      
      for (const session of orphanedSessions) {
        try {
          // Count chunks for this session
          const { count: chunkCount } = await supabase
            .from('upload_chunks')
            .select('*', { count: 'exact' })
            .eq('session_id', session.id);

          console.log(`Cleaning session ${session.id} with ${chunkCount || 0} chunks`);

          // Delete chunks first
          const { error: chunksError } = await supabase
            .from('upload_chunks')
            .delete()
            .eq('session_id', session.id);

          if (chunksError) {
            console.error(`Failed to delete chunks for session ${session.id}:`, chunksError);
            errors.push(`Failed to delete chunks for session ${session.id}: ${chunksError.message}`);
          } else {
            cleanedChunks += chunkCount || 0;
            console.log(`Deleted ${chunkCount || 0} chunks for session ${session.id}`);
          }

          // Delete session
          const { error: sessionError } = await supabase
            .from('upload_sessions')
            .delete()
            .eq('id', session.id)
            .eq('user_id', user.id);

          if (sessionError) {
            console.error(`Failed to delete session ${session.id}:`, sessionError);
            errors.push(`Failed to delete session ${session.id}: ${sessionError.message}`);
          } else {
            cleanedSessions++;
            console.log(`Successfully deleted session ${session.id}`);
          }

        } catch (error) {
          console.error(`Exception cleaning session ${session.id}:`, error);
          errors.push(`Exception cleaning session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    const result = {
      success: true,
      message: `Cleaned up ${cleanedSessions} orphaned sessions and ${cleanedChunks} chunks`,
      details: {
        sessionsFound: orphanedSessions?.length || 0,
        sessionsCleaned: cleanedSessions,
        chunksCleaned: cleanedChunks,
        errors: errors.length > 0 ? errors : undefined
      }
    };

    console.log('Cleanup completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Cleanup error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during cleanup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to analyze orphaned uploads without cleaning them
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all upload sessions for the user
    const { data: allSessions, error: sessionsError } = await supabase
      .from('upload_sessions')
      .select('id, status, created_at, file_name, total_chunks, completed_chunks')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Get total chunk count
    const { count: totalChunks } = await supabase
      .from('upload_chunks')
      .select('*', { count: 'exact' })
      .in('session_id', allSessions?.map(s => s.id) || []);

    const analysis = {
      totalSessions: allSessions?.length || 0,
      totalChunks: totalChunks || 0,
      sessionsByStatus: allSessions?.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      orphanedSessions: allSessions?.filter(s => s.status === 'completed' || s.status === 'failed') || [],
      pendingSessions: allSessions?.filter(s => s.status === 'pending' || s.status === 'processing') || []
    };

    return NextResponse.json({
      success: true,
      analysis,
      recommendation: analysis.orphanedSessions.length > 0 
        ? `Found ${analysis.orphanedSessions.length} orphaned sessions that can be cleaned up`
        : 'No orphaned sessions found'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 