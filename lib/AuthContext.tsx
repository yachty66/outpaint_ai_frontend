"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  credits: number;
  setCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  credits: 0,
  setCredits: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const restoreSession = async () => {
      // Check if we need to restore the session
      const urlParams = new URLSearchParams(window.location.search);
      const shouldRestore = urlParams.get("restore_session");

      if (shouldRestore) {
        const savedSession = localStorage.getItem("savedAuthSession");
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession);
            await supabase.auth.setSession(session);
            // Clear the saved session after restoration
            localStorage.removeItem("savedAuthSession");
          } catch (error) {
            console.error("Failed to restore session:", error);
          }
        }
      }

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserCredits(session.user.id);
      }
      setLoading(false);
    };

    restoreSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserCredits(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserCredits = async (userId: string) => {
    // First get the user's email from the auth session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.error("No user email found");
      return;
    }

    // First try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("credits")
      .eq("email", user.email)
      .single();

    if (fetchError || !existingUser) {
      // User doesn't exist, create new user with default credits
      const { error: createError } = await supabase.from("users").insert([
        {
          email: user.email,
          credits: 2, // Default credits for new users
        },
      ]);

      if (createError) {
        console.error("Error creating new user:", createError);
      } else {
        setCredits(2);
      }
    } else {
      // Existing user found, set their credits
      setCredits(existingUser.credits);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, credits, setCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
