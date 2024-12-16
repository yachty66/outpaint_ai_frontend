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
      // First try to get existing user
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('credits')
        .eq('email', email)
        .single();

      if (fetchError || !existingUser) {
        // If user doesn't exist, create new user with 2 initial credits
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            { email: email, credits: 2 }
          ])
          .select('credits')
          .single();

        if (insertError) throw insertError;
        return newUser?.credits ?? 0;
      }

      // Return existing user's credits
      return existingUser.credits;
    } catch (error) {
      console.error("Error managing user credits:", error);
      return 0;
    }
  };

  const decrementCredits = async () => {
    if (!user?.email) return;

    try {
      // First get current credits
      const { data: currentData, error: fetchError } = await supabase
        .from('users')
        .select('credits')
        .eq('email', user.email)
        .single();

      if (fetchError) throw fetchError;

      const currentCredits = currentData?.credits ?? 0;
      const newCredits = Math.max(0, currentCredits - 1);

      // Update credits in database
      const { data: updatedData, error: updateError } = await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('email', user.email)
        .select('credits')
        .single();

      if (updateError) throw updateError;

      // Update local state only after successful database update
      setCredits(updatedData.credits);
      
      console.log('Credits updated in database:', updatedData.credits); // Debug log
      return updatedData.credits;
    } catch (error) {
      console.error("Error decrementing credits:", error);
      return null;
    }
  };

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