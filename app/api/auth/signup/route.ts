// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, dob, role = 'parent' } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password should be at least 6 characters", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    if (!dob) {
      return NextResponse.json(
        { error: "Date of birth is required", code: "DOB_REQUIRED" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedFullName = fullName?.trim() || '';

    // Calculate age from DOB
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Validate role based on age
    let finalRole = role;
    
    // Auto-assign kid role for users under 16
    if (age < 16) {
      finalRole = 'kid';
    } else {
      // Validate adult roles
      const adultRoles = ['parent', 'guardian', 'teacher', 'caregiver', 'healthcare_provider'];
      if (!adultRoles.includes(role)) {
        finalRole = 'parent'; // Default to parent for adults
      }
      
      // Additional age validations for specific roles
      if (role === 'healthcare_provider' && age < 21) {
        return NextResponse.json(
          { error: "You must be at least 21 years old to register as a healthcare provider", code: "AGE_RESTRICTION" },
          { status: 400 }
        );
      }
      
      if (['guardian', 'teacher', 'caregiver'].includes(role) && age < 18) {
        return NextResponse.json(
          { error: "You must be at least 18 years old for this role", code: "AGE_RESTRICTION" },
          { status: 400 }
        );
      }
    }

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

    // Sign up with Supabase Auth - WITHOUT auto-confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        data: {
          full_name: normalizedFullName,
          role: finalRole,
          dob: dob
        },
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback?type=signup`,
      },
    });

    if (authError) {
      // Map common Supabase errors to consistent error codes
      let errorCode = "AUTH_ERROR";
      
      if (authError.message.includes("User already registered")) {
        errorCode = "USER_EXISTS";
      } else if (authError.message.includes("Password should be at least")) {
        errorCode = "WEAK_PASSWORD";
      } else if (authError.message.includes("Invalid email")) {
        errorCode = "INVALID_EMAIL";
      } else if (authError.message.includes("Email rate limit exceeded")) {
        errorCode = "RATE_LIMITED";
      }

      return NextResponse.json(
        { 
          error: authError.message,
          code: errorCode 
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      throw new Error("User creation failed - no user data returned");
    }

    const userId = authData.user.id;

    // Create profile in profiles table with 'unverified' role initially
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: normalizedFullName,
        email: normalizedEmail,
        role: 'unverified', // Set as unverified initially
        metadata: {
          dob: dob,
          age: age,
          intended_role: finalRole, // Store intended role for after verification
          signup_completed: false,
          created_at: new Date().toISOString()
        },
        children_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      
      // If profile creation fails, attempt to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { 
          error: "Failed to create user profile",
          code: "PROFILE_CREATION_FAILED"
        },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    // With Supabase, if email confirmation is enabled, it will always require verification
    // unless we manually confirm the email (which we're not doing)
    const needsEmailVerification = true; // Always require verification for new signups

    // Return consistent response shape
    const responseData = {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'unverified',
        age: age,
        needsEmailVerification: true
      },
      session: null, // No session until email is verified
      needsEmailVerification: true,
      role: finalRole,
      age: age,
      message: "Account created successfully. Please check your email to verify your account."
    };

    console.log(`User ${userId} signed up successfully. Verification email sent.`);

    return NextResponse.json(responseData);

  } catch (err: any) {
    console.error("Signup error:", err);
    
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
    { error: "Method not allowed" },
    { status: 405 }
  );
}