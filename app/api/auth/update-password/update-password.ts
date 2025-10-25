// app/api/auth/update-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { newPassword } = await request.json();

    // Validation
    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required", code: "MISSING_PASSWORD" },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Password should be at least 6 characters", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    const normalizedPassword = newPassword.trim();

    // Update user password
    const { data, error } = await supabase.auth.updateUser({ 
      password: normalizedPassword 
    });

    if (error) {
      let errorCode = "AUTH_ERROR";
      
      // Map common password update errors
      if (error.message.includes("Password should be at least")) {
        errorCode = "WEAK_PASSWORD";
      } else if (error.message.includes("session")) {
        errorCode = "INVALID_SESSION";
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

    // Return success response
    return NextResponse.json({ 
      success: true,
      user: data.user 
    });

  } catch (err: any) {
    console.error("Update password error:", err);
    
    return NextResponse.json(
      { 
        error: err.message || "Internal server error",
        code: "AUTH_API_ERROR"
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}