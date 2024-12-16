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
        const { uploadedImage, processedImage } = authState;

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // If no session, redirect to sign in with all necessary parameters
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback?payment_success=true&uploadedImage=${encodeURIComponent(uploadedImage || '')}&processedImage=${encodeURIComponent(processedImage || '')}`
            }
          });
          return;
        }

        // If we have a session, refresh it and redirect
        await refreshSession();
        
        const searchParams = new URLSearchParams({
          payment_success: 'true',
          ...(uploadedImage && { uploadedImage }),
          ...(processedImage && { processedImage })
        });

        router.push(`/?${searchParams.toString()}`);
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