
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import AuthScreen from "@/components/auth-screen"
import useStore from "@/store/useStore"
import type { User } from "@supabase/supabase-js"

export default function Home() {
  const router = useRouter()
  const { setUser } = useStore()
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUserState(currentUser)
      setUser(currentUser)
      setLoading(false)
      
      // Redirect to home if authenticated
      if (currentUser) {
        router.push('/home')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUserState(currentUser)
      setUser(currentUser)
      
      // Redirect to home if authenticated
      if (currentUser) {
        router.push('/home')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return user ? null : <AuthScreen />
}
