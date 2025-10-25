import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { redirectTo = "/" } = await request.json();

    // Build redirect URL for OAuth callback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    
    const redirectUrl = new URL(`${baseUrl}/auth/callback`);
    
    // Encode redirectTo state for after OAuth completion
    const state = { redirectTo };
    redirectUrl.searchParams.set("state", btoa(JSON.stringify(state)));

    console.log('🔗 OAuth Redirect URL:', redirectUrl.toString());

    // Create admin client for server-side operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Initiate Google OAuth signin
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      },
    });

    if (error) {
      console.error('❌ Supabase OAuth error:', error);
      let errorCode = "OAUTH_ERROR";
      
      if (error.message.includes("Provider")) {
        errorCode = "INVALID_PROVIDER";
      } else if (error.message.includes("configuration")) {
        errorCode = "OAUTH_CONFIG_ERROR";
      } else if (error.message.includes("rate limit")) {
        errorCode = "RATE_LIMITED";
      }

      return NextResponse.json(
        { 
          error: error.message,
          code: errorCode 
        },
        { status: 400 }
      );
    }

    if (!data?.url) {
      throw new Error('No OAuth URL returned from Supabase');
    }

    console.log('✅ OAuth URL generated successfully');
    
    // Return the OAuth URL to redirect the client
    return NextResponse.json({ 
      success: true,
      url: data.url
    });

  } catch (err: any) {
    console.error("💥 Google OAuth error:", err);
    
    return NextResponse.json(
      { 
        error: err.message || "Internal server error",
        code: "OAUTH_ERROR"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}