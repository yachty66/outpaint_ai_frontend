"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
  credits: number
  decrementCredits: () => void
  hasCredits: () => boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  credits: 0,
  decrementCredits: () => {}, 
  hasCredits: () => false,
  refreshSession: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        setCredits(paymentSuccess === 'true' ? 60 : 0);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  const decrementCredits = async () => {
    setCredits(prev => Math.max(0, prev - 1));
  }

  const hasCredits = () => credits > 0;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const urlParams = new URLSearchParams(window.location.search);
          const paymentSuccess = urlParams.get('payment_success');
          
          setCredits(paymentSuccess === 'true' ? 60 : 0);
        } else {
          setUser(null);
          setCredits(0);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
          const urlParams = new URLSearchParams(window.location.search);
          const paymentSuccess = urlParams.get('payment_success');
          setCredits(paymentSuccess === 'true' ? 60 : 0);
        }
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      credits, 
      decrementCredits, 
      hasCredits,
      refreshSession 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)