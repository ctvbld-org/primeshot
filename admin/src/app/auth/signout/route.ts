import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const login_path = process.env.NEXT_PUBLIC_BASE_PATH || '/'

// We can't use the auth context here because this is a server route
// Instead, we'll use the server client but with proper error handling
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return NextResponse.redirect(new URL(login_path, request.url));
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.redirect(new URL(login_path, request.url));
  }
}

// Use POST for form submissions
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return NextResponse.redirect(new URL(login_path, request.url));
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.redirect(new URL(login_path, request.url));
  }
} 