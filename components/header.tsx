"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { User, Github } from "lucide-react"

export function Header() {
  const { user } = useAuth()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
            StableCharacter
          </Link>
          <a
            href="https://github.com/yachty66/outpaint_ai_frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Credits: 5</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleSignOut}
            >
              <User className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSignIn}
          >
            <User className="w-4 h-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}