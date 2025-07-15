"use client"

import { useState, useEffect } from "react"
import { Settings, LogOut, Edit, Upload, Download, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TopNav from "@/components/top-nav"
import { useToast } from "@/hooks/use-toast"
import { getUserTier } from "@/lib/tier-system"

export default function ProfileScreen({ user, onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ uploads: 0, downloads: 0, earnings: 0 })
  const [tierInfo, setTierInfo] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
    fetchStats()
    fetchTierInfo()
  }, [user.id])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("users")
      .select("name, email, school, department, level")
      .eq("id", user.id)
      .single()

    if (data) setProfile(data)
  }

  const fetchStats = async () => {
    // Fetch uploads count
    const { count: uploadsCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("uploader_id", user.id)

    // Fetch downloads count
    const { count: downloadsCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", user.id)

    // Calculate earnings (sum of all sales)
    const { data: salesData } = await supabase.from("transactions").select("amount").eq("buyer_id", user.id)

    const totalEarnings = salesData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

    setStats({
      uploads: uploadsCount || 0,
      downloads: downloadsCount || 0,
      earnings: totalEarnings,
    })
  }

  const fetchTierInfo = async () => {
    const { count: uploadCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("uploader_id", user.id)

    const tier = getUserTier(uploadCount || 0)
    setTierInfo(tier)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav title="Profile" showBack onBack={() => onNavigate("home")} />
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
           <img src='/cat.png' className="w-full h-full rounded-full " alt="cat" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.name || "User"}</h2>
          <p className="text-gray-600">{profile?.email}</p>
        </div>

        {/* Tier Info Card */}
        {tierInfo && (
          <Card className="rounded-2xl card-shadow bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5" />
                    <h3 className="font-bold">{tierInfo.name} Tier</h3>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      Level {tierInfo.level}
                    </Badge>
                  </div>
                  <p className="text-purple-100 text-sm">
                    {stats.uploads}/{tierInfo.uploadLimit} uploads used
                  </p>
                  <p className="text-purple-100 text-xs mt-1">
                    Price range: {tierInfo.priceRange}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{tierInfo.level}</div>
                  <div className="text-purple-200 text-xs">Tier Level</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="rounded-xl card-shadow text-center bg-white">
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.uploads}</p>
              <p className="text-xs text-gray-600">Uploads</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl card-shadow text-center bg-white">
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.downloads}</p>
              <p className="text-xs text-gray-600">Downloads</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl card-shadow text-center bg-white">
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">💰</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₦{stats.earnings.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        {profile && (
          <Card className="rounded-2xl card-shadow bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">School</p>
                    <p className="font-medium text-gray-900">{profile.school}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Level</p>
                    <p className="font-medium text-gray-900">Level {profile.level}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{profile.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 bg-white hover:bg-gray-50">
            <Settings className="w-5 h-5 mr-3" />
            Settings & Privacy
          </Button>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 bg-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
