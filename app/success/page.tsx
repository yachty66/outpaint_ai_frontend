'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function SuccessPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authStateStr = urlParams.get('authState');
        
        if (!authStateStr) {
          console.error('No auth state found in URL');
          router.push('/');
          return;
        }

        const authState = JSON.parse(decodeURIComponent(authStateStr));
        console.log('Restored auth state:', authState);

        // Try to get an existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // If no session exists, try to sign in again
          const { error: signInError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback?payment_success=true`
            }
          });

          if (signInError) {
            console.error('Error signing in:', signInError);
            router.push('/');
            return;
          }
        } else {
          // If we have a session, just refresh and redirect
          await refreshSession();
          router.push('/?payment_success=true');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        router.push('/');
      }
    };

    handleSuccess();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing your payment and restoring your session...</p>
    </div>
  );
}