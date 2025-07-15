
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ProfileScreen from "@/components/screens/profile-screen"
import useStore from "@/store/useStore"

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser } = useStore()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)
    }
    checkAuth()
  }, [router, setUser])

  const handleNavigate = (route) => {
    router.push(`/${route}`)
  }

  if (!user) return null

  return <ProfileScreen user={user} onNavigate={handleNavigate} />
}
