// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { 
          error: error.message,
          code: "AUTH_ERROR"
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Verification email sent" 
    });

  } catch (err: any) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { 
        error: err.message || "Internal server error",
        code: "AUTH_API_ERROR"
      },
      { status: 500 }
    );
  }
}