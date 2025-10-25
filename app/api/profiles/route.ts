// app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { user_id, full_name, role } = await request.json();

    // Validation
    if (!user_id || !full_name) {
      return NextResponse.json(
        { error: "Missing required parameters: user_id and full_name" },
        { status: 400 }
      );
    }

    // Upsert profile data
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert([{ 
        id: user_id, 
        full_name, 
        role: role || 'parent' 
      }]);

    if (error) {
      console.error("Profile upsert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      ok: true,
      message: "Profile updated successfully" 
    });

  } catch (err: any) {
    console.error("Profile API error:", err);
    
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}