
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, FileText, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useStore from "@/store/useStore"

export default function AdminPage() {
  const router = useRouter()
  const { user } = useStore()
  const { toast } = useToast()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchPendingResources()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
      return
    }
    
    // Check if user is admin (you can add admin check logic here)
    // For now, assuming any logged-in user can access admin panel
  }

  const fetchPendingResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select(`
          *,
          users (name, email)
        `)
        .eq("verified", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      setResources(data || [])
    } catch (error) {
      console.error("Error fetching resources:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (resourceId, approved) => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({ verified: approved })
        .eq("id", resourceId)

      if (error) throw error

      toast({
        title: approved ? "Resource Approved ✅" : "Resource Rejected ❌",
        description: approved 
          ? "The resource is now verified and visible to all users"
          : "The resource has been rejected",
      })

      // Remove from list
      setResources(prev => prev.filter(r => r.id !== resourceId))
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">Review and approve resources</p>
              </div>
            </div>
            <Button onClick={() => router.push('/home')} variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Pending Approvals ({resources.length})
            </h2>
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All caught up! 🎉
            </h3>
            <p className="text-gray-600">No resources pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="rounded-2xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {resource.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {resource.description || "No description provided"}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="rounded-lg">
                              {resource.department}
                            </Badge>
                            <Badge variant="outline" className="rounded-lg">
                              Level {resource.level}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`rounded-lg ${
                                resource.price === 0 
                                  ? "text-green-600 border-green-200" 
                                  : "text-blue-600 border-blue-200"
                              }`}
                            >
                              {resource.price === 0 
                                ? "FREE" 
                                : `₦${resource.price.toLocaleString()}`}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Uploaded by: {resource.users?.name || "Unknown"} ({resource.users?.email})
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleApproval(resource.id, false)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleApproval(resource.id, true)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
