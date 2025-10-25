// app/api/auth/reset-password/route.ts
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

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${request.headers.get('origin')}/auth/update-password`,
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
      message: "Password reset email sent" 
    });

  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { 
        error: err.message || "Internal server error",
        code: "AUTH_API_ERROR"
      },
      { status: 500 }
    );
  }
}