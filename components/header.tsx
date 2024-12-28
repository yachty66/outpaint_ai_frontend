"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User, Github, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export function Header() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, credits } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsMenuOpen(false);
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Failed to sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await supabase.auth.signOut();
    window.dispatchEvent(new Event("userSignedOut"));
    router.push("/");
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-semibold transition-colors"
          >
            <span className="text-orange-500 hover:text-orange-600">
              Outpainting
            </span>
            <span className="text-gray-900">AI</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <a
              href="https://github.com/yachty66/outpaintingai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900"
            >
              <Github className="w-6 h-6" />
            </a>
            {user && (
              <Link
                href="/generations"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Generations
              </Link>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <Button
            variant="outline"
            size="default"
            className="gap-2 text-base"
            asChild
          >
            <a href="mailto:maxhager28@gmail.com">Support</a>
          </Button>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Credits: {credits}</span>
              <Button
                variant="ghost"
                size="default"
                className="gap-2 text-base"
                onClick={handleSignOut}
              >
                <User className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="default"
              className="gap-2 text-base"
              onClick={handleSignIn}
              disabled={isSigningIn}
            >
              <User className="w-5 h-5" />
              {isSigningIn ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-x-0 top-14 bg-white border-b shadow-lg sm:hidden z-50">
            <div className="container mx-auto divide-y divide-gray-100">
              {/* User Info Section */}
              {user && (
                <div className="px-4 py-4">
                  <div className="bg-orange-50 rounded-lg p-4 mb-2">
                    <span className="text-sm text-gray-600 block mb-1">
                      Available Credits
                    </span>
                    <span className="text-3xl font-semibold text-orange-600">
                      {credits}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="px-4 py-3">
                <nav className="space-y-2">
                  {user && (
                    <Link
                      href="/generations"
                      className="flex items-center gap-2 w-full p-2 rounded-md text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="font-medium">Generations</span>
                    </Link>
                  )}
                  <a
                    href="https://github.com/yachty66/outpaintingai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Github className="w-5 h-5" />
                    <span className="font-medium">GitHub</span>
                  </a>
                  <a
                    href="mailto:maxhager28@gmail.com"
                    className="flex items-center gap-2 w-full p-2 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="font-medium">Support</span>
                  </a>
                </nav>
              </div>

              {/* Account Actions */}
              <div className="px-4 py-3">
                {user ? (
                  <Button
                    variant="ghost"
                    size="default"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="default"
                    className="w-full justify-start gap-2"
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">
                      {isSigningIn ? "Signing in..." : "Sign In"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
