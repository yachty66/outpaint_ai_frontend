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

    const { data, error } = await supabase
      .from("users")
      .select("credits")
      .eq("email", user.email)
      .single();

    console.log("fetch user credits data", data);
    console.log("fetch user credits error", error);
    console.log("fetch user credits email", user.email);

    if (!error && data) {
      setCredits(data.credits);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, credits, setCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
