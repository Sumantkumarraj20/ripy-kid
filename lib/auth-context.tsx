// lib/auth-context.tsx - Updated version
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if Supabase is properly configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('mock-url')) {
          console.warn('Supabase not configured - running in demo mode');
          setIsSupabaseConnected(false);
          setLoading(false);
          return;
        }

        setIsSupabaseConnected(true);
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Only set up auth state listener if Supabase is connected
    if (isSupabaseConnected) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth state changes
        if (event === 'SIGNED_IN') {
          // Refresh the page to sync with middleware
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          // Redirect to auth page if on protected route
          const protectedPaths = ['/profile', '/dashboard', '/learn', '/progress', '/classroom'];
          const isProtectedPath = protectedPaths.some(path => 
            pathname.startsWith(path)
          );
          if (isProtectedPath) {
            router.push('/auth');
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [isSupabaseConnected, router, pathname]);

  const signOut = async () => {
    try {
      if (isSupabaseConnected) {
        await supabase.auth.signOut();
      }
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isSupabaseConnected }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}