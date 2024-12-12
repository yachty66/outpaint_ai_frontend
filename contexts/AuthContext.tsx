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
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  credits: 0,  // Start with 5 credits
  decrementCredits: () => {}, 
  hasCredits: () => false 
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)  // Start with 5 credits

  const decrementCredits = async () => {
    setCredits(prev => Math.max(0, prev - 1));
  }

  const hasCredits = () => credits > 0;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, credits, decrementCredits, hasCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);