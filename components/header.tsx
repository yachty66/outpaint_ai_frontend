"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { User, Github } from "lucide-react"
import { useState } from "react"

export function Header() {
  const { user, credits } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    if (isSigningIn) return
    
    setIsSigningIn(true)
    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
      
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Failed to sign in. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
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
            <span className="text-sm text-gray-600">Credits: {credits}</span>
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
            disabled={isSigningIn}
          >
            <User className="w-4 h-4" />
            {isSigningIn ? 'Signing in...' : 'Sign In'}
          </Button>
        )}
      </div>
    </header>
  )
}