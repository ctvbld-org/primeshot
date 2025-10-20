import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime to support larger payloads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 minutes (for Claude Sonnet analysis)

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing', fallback: true },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    
    // Forward to Supabase Edge Function (3 minute timeout for Claude Sonnet analysis)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes
    
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-photo-quality`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Edge function error:', data);
        return NextResponse.json(
          { error: 'Analysis failed', fallback: true, details: data },
          { status: response.status }
        );
      }
      
      return NextResponse.json(data);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle fetch timeout or network errors
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Edge function timeout after 3 minutes');
        return NextResponse.json(
          { error: 'Analysis timeout', fallback: true, message: 'Request took too long' },
          { status: 504 }
        );
      }
      
      throw fetchError; // Re-throw to outer catch
    }
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Request failed', 
        fallback: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

