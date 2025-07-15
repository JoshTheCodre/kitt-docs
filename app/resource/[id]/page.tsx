
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ResourceDetailScreen from "@/components/screens/resource-detail-screen"
import BottomNav from "@/components/bottom-nav"
import useStore from "@/store/useStore"

export default function ResourcePage() {
  const router = useRouter()
  const params = useParams()
  const { user, setUser } = useStore()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (params.id) {
      fetchResource()
    }
  }, [params.id])

  const fetchResource = async () => {
    try {
      const { data } = await supabase
        .from("resources")
        .select("*")
        .eq("id", params.id)
        .single()
      
      if (data) {
        setResource(data)
      } else {
        router.push('/explore')
      }
    } catch (error) {
      router.push('/explore')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (route) => {
    router.push(`/${route}`)
  }

  const handleBack = () => {
    router.push('/explore')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading resource...</p>
        </div>
      </div>
    )
  }

  if (!user || !resource) return null

  return (
    <>
      <div className="pb-20">
        <ResourceDetailScreen 
          user={user} 
          resource={resource} 
          onNavigate={handleNavigate}
          onBack={handleBack}
        />
      </div>
      <BottomNav />
    </>
  )
}
