// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (!token_hash) {
      return NextResponse.redirect(new URL('/auth?error=invalid_token', request.url));
    }

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

    // Verify the token
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: 'email'
    });

    if (error || !data.user) {
      console.error('Token verification error:', error);
      return NextResponse.redirect(new URL('/auth?error=token_verification_failed', request.url));
    }

    // Update user profile to mark as verified
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        metadata: {
          ...data.user.user_metadata,
          email_verified: true,
          verified_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Don't fail the verification if profile update fails
    }

    // Redirect to success page or signin
    return NextResponse.redirect(new URL('/auth?message=email_verified', request.url));

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth?error=verification_failed', request.url));
  }
}