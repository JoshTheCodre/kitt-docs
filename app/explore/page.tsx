"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ExploreScreen from "@/components/screens/explore-screen"
import BottomNav from "@/components/bottom-nav"
import useStore from "@/store/useStore"

export default function ExplorePage() {
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

  const handleResourceSelect = (resource) => {
    router.push(`/resource/${resource.id}`)
  }

  if (!user) return null

  return (
    <>
      <div className="pb-20">
        <ExploreScreen user={user} onNavigate={handleNavigate} onResourceSelect={handleResourceSelect} />
      </div>
      <BottomNav />
    </>
  )
}