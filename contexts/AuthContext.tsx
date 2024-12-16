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

  const loadOrCreateUserCredits = async (email: string) => {
    try {
      // Use upsert to either update existing or insert new
      const { data, error } = await supabase
        .from('users')
        .upsert(
          { email: email, credits: 2 },
          { 
            onConflict: 'email',  // specify email as the conflict column
            ignoreDuplicates: false // update if exists
          }
        )
        .select('credits')
        .single()

      if (error) throw error
      return data?.credits ?? 0
    } catch (error) {
      console.error("Error managing user credits:", error)
      return 0
    }
  }

  const decrementCredits = async () => {
    if (!user?.email) return

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ credits: credits - 1 })
        .eq('email', user.email)
        .select('credits')
        .single()

      if (error) throw error
      setCredits(data.credits)
    } catch (error) {
      console.error("Error decrementing credits:", error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const userCredits = await loadOrCreateUserCredits(session.user.email!)
        setCredits(userCredits);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  const hasCredits = () => credits > 0;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const userCredits = await loadOrCreateUserCredits(session.user.email!)
          setCredits(userCredits);
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
          const userCredits = await loadOrCreateUserCredits(session.user.email!)
          setCredits(userCredits);
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