// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:");
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL:",
    supabaseUrl ? "✓ Set" : "✗ Missing"
  );
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "✓ Set" : "✗ Missing"
  );

  // Create a mock client for development if variables are missing
  if (process.env.NODE_ENV === "development") {
    console.warn("Creating mock Supabase client for development");
  }
}

export const supabase = createClient(
  supabaseUrl || "https://mock-url.supabase.co",
  supabaseAnonKey || "mock-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  }
);

// Admin client for server-side operations (optional)
export const supabaseAdmin = createClient(
  supabaseUrl || "https://mock-url.supabase.co",
  supabaseServiceKey || "mock-service-role-key"
);
