"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function SuccessPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        console.log("Starting success handler");

        // Retrieve stored session
        const storedSession = sessionStorage.getItem("pre-stripe-session");
        if (storedSession) {
          const { access_token, refresh_token } = JSON.parse(storedSession);

          // Set the session
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          // Clear stored session
          sessionStorage.removeItem("pre-stripe-session");
        }

        // Refresh the session in auth context to update credits
        await refreshSession();
        router.push("/?payment_success=true");
      } catch (error) {
        console.error("Error in success page:", error);
        router.push("/");
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
