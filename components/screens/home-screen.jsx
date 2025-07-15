"use client";

import { useEffect, useState } from "react";
import {
  User,
  Star,
  ArrowRight,
  BookOpen,
  UploadIcon,
  Award,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModernSearch from "@/components/modern-search";
import InstallAppButton from "@/components/install-app-button";
import SupportBubble from "@/components/support-bubble";

export default function HomeScreen({ user, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [forYouResources, setForYouResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    console.log("User zzz : ", user);
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      fetchForYouResources();
    }
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from("users")
        .select("name, school, department, level")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForYouResources = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("department", profile.department)
      .eq("level", profile.level)
      .order("created_at", { ascending: false })
      .limit(4);

    if (data) setForYouResources(data);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex justify-between items-center px-1 mt-2">
          <div className="text-left space-y-1">
            <p className="text-gray-500 text-sm">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? "Loading..." : profile?.name || "Student"} 👋
            </h1>
          </div>
          <button
            onClick={() => onNavigate("profile")}
            className="w-12 h-12 bg-blue-500 rounded-full border border-blue-300 flex items-center justify-center shadow-lg"
          >
            <img
              src="/cat.png"
              className="w-full h-full rounded-full"
              alt="cat"
            />
          </button>
        </div>

        {/* Search */}
        <ModernSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={() => onNavigate("explore")}
        />

        {/* Install App Button */}
        <InstallAppButton className="mb-4" />

        {/* For You Section - Gen Z Friendly */}
        {profile && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Made for You ✨
              </h2>
              <p className="text-gray-600">Resources that match your vibe</p>
            </div>

            <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <Star className="w-10 h-10 text-yellow-300" />
                </div>
                <h3 className="font-bold text-2xl mb-3">Welcome!</h3>
                <p className="text-white/90 text-lg mb-6">
                  Explore the latest features and resources.
                </p>
                <Button
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                  onClick={() => onNavigate("explore")}
                >
                  Discover Now 
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="rounded-xl card-shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("upload")}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <UploadIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Upload Resource
              </h3>
              <p className="text-gray-600 text-xs">Share & Earn</p>
            </CardContent>
          </Card>

          <Card
            className="rounded-xl card-shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("wallet")}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">My Wallet</h3>
              <p className="text-gray-600 text-xs">Manage Funds</p>
            </CardContent>
          </Card>
        </div>

        {/* Recommended for You */}
        {forYouResources.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recommended for You
              </h2>
              <Button
                variant="ghost"
                className="text-blue-600 font-medium hover:bg-blue-50 rounded-lg"
                onClick={() => onNavigate("explore")}
              >
                See All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {forYouResources.slice(0, 3).map((resource) => (
                <Card
                  key={resource.id}
                  className="rounded-xl card-shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {resource.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                          {resource.description || "No description available"}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="text-xs rounded-md"
                          >
                            {resource.department}
                          </Badge>
                          <span className="text-blue-600 font-bold text-sm">
                            {resource.price === 0
                              ? "Free"
                              : `₦${resource.price.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <SupportBubble />
    </div>
  );
}
