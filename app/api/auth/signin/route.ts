// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error) {
      let errorCode = "AUTH_ERROR";
      
      if (error.message.includes("Invalid login credentials")) {
        errorCode = "INVALID_CREDENTIALS";
      } else if (error.message.includes("Email not confirmed")) {
        errorCode = "EMAIL_NOT_VERIFIED";
      } else if (error.message.includes("Email rate limit exceeded")) {
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

    const emailVerified = Boolean(
      (data.user as any)?.email_confirmed_at || 
      data.session?.user?.email_confirmed_at
    );

    return NextResponse.json({ 
      user: data.user, 
      session: data.session, 
      emailVerified 
    });

  } catch (err: any) {
    console.error("Signin error:", err);
    return NextResponse.json(
      { 
        error: err.message || "Internal server error",
        code: "AUTH_API_ERROR"
      },
      { status: 500 }
    );
  }
}