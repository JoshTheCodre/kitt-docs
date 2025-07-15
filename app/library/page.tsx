"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import LibraryScreen from "@/components/screens/library-screen"
import BottomNav from "@/components/bottom-nav"
import useStore from "@/store/useStore"

export default function LibraryPage() {
  const router = useRouter()
  const { user, setUser, setSelectedResource } = useStore()

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
    setSelectedResource(resource)
    router.push(`/resource/${resource.id}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="pb-20">
        <LibraryScreen onNavigate={handleNavigate} onResourceSelect={handleResourceSelect} />
      </div>
      <BottomNav />
    </>
  )
}