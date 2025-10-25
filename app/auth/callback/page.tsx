"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Processing authentication...');

        // First, check if this is an OAuth callback with hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorDescription = hashParams.get('error_description');

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (accessToken) {
          // We have tokens in URL hash - set the session manually
          await handleTokenAuth(accessToken, refreshToken);
          return;
        }

        // If no hash parameters, try to get the session normally
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          // Success case - we have a session
          await handleSuccessfulAuth(session);
          return;
        }

        // Check for email verification scenarios
        const needsVerification = searchParams.get('needs_verification');
        if (needsVerification) {
          setStatus('success');
          setMessage('Please check your email to verify your account');
          
          setTimeout(() => {
            router.push('/auth?message=check_email');
          }, 3000);
          return;
        }

        // If we get here, authentication failed
        throw new Error('Unable to complete authentication - no session or tokens found');

      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        // Redirect to auth page with error after delay
        setTimeout(() => {
          const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
          router.push(`/auth?error=${errorMessage}`);
        }, 3000);
      }
    };

    const handleSuccessfulAuth = async (session: any) => {
      setStatus('success');
      setMessage('Successfully signed in!');

      // Get redirect path
      let redirectTo = '/';
      
      // Check for state parameter from OAuth
      const stateParam = searchParams.get('state');
      if (stateParam) {
        try {
          const state = JSON.parse(atob(stateParam));
          if (state.redirectTo) {
            redirectTo = state.redirectTo;
          }
        } catch (e) {
          console.log('No valid state parameter found');
        }
      }

      // Check for stored redirect path
      const storedRedirect = sessionStorage.getItem('auth_redirect');
      if (storedRedirect && storedRedirect !== '/auth') {
        redirectTo = storedRedirect;
      }

      // Clear stored redirect
      sessionStorage.removeItem('auth_redirect');

      console.log('Redirecting to:', redirectTo);
      
      // Short delay to show success message
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    };

    const handleTokenAuth = async (accessToken: string, refreshToken: string | null) => {
      setMessage('Setting up your session...');
      
      // Set the session with tokens from URL
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (error) throw error;
      if (!session) throw new Error('Failed to establish session');

      await handleSuccessfulAuth(session);
    };

    handleAuthCallback();
  }, [router, searchParams]);

  // Render appropriate UI based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-300',
          spinnerColor: 'border-blue-200 border-t-blue-600',
          icon: '🔄'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-300',
          spinnerColor: 'border-green-200 border-t-green-600',
          icon: '✅'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-300',
          spinnerColor: 'border-red-200 border-t-red-600',
          icon: '❌'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
      <div className={`rounded-2xl p-8 max-w-md w-full text-center space-y-6 ${statusConfig.bgColor}`}>
        
        {/* Status Icon/Spinner */}
        <div className="flex justify-center">
          {status === 'loading' ? (
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${statusConfig.spinnerColor}`}></div>
          ) : (
            <div className="text-4xl">{statusConfig.icon}</div>
          )}
        </div>
        
        {/* Message */}
        <div className="space-y-2">
          <h2 className={`text-xl font-semibold ${statusConfig.textColor}`}>
            {status === 'loading' && 'Completing authentication...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Something went wrong'}
          </h2>
          <p className={statusConfig.textColor}>{message}</p>
        </div>

        {/* Progress Bar for loading state */}
        {status === 'loading' && (
          <div className="w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Action buttons for error state */}
        {status === 'error' && (
          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={() => router.push('/auth')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}