"use client";

import { useState, useEffect } from "react";
import { Download, Upload, FileText, BookOpen, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopNav from "@/components/top-nav";
import useStore from "@/store/useStore";

export default function LibraryScreen({ onNavigate }) {
  const { user } = useStore();
  const [downloads, setDownloads] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [uploadStats, setUploadStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDownloads();
      fetchUploads();
    }
  }, [user?.id]);

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from("downloads")
        .select(
          `
          id,
          downloaded_at,
          resources (
            id,
            title,
            department,
            level,
            price,
            file_type,
            storage_path,
            preview_path,
            created_at
          )
        `,
        )
        .eq("user_id", user.id)
        .order("downloaded_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const resources = data.map((item) => item.resources).filter(Boolean);
        setDownloads(resources);
      }
    } catch (error) {
      console.error("Error fetching downloads:", error);
      setDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("uploader_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setUploads(data);
        fetchUploadStats(data);
      }
    } catch (error) {
      console.error("Error fetching uploads:", error);
      setUploads([]);
    }
  };

  const fetchUploadStats = async (resources) => {
    const stats = {};

    for (const resource of resources) {
      try {
        // Get purchase count and total earnings
        const { data: purchases } = await supabase
          .from("transactions")
          .select("amount")
          .eq("resource_id", resource.id);

        // Get download count
        const { data: downloads } = await supabase
          .from("downloads")
          .select("id")
          .eq("resource_id", resource.id);

        // Get view count (simulated for now)
        const viewCount = Math.floor(Math.random() * 1000) + 50;

        stats[resource.id] = {
          purchases: purchases?.length || 0,
          totalEarnings:
            purchases?.reduce((sum, p) => sum + p.amount * 0.9, 0) || 0,
          downloads: downloads?.length || 0,
          views: viewCount,
        };
      } catch (error) {
        console.error("Error fetching stats for resource:", resource.id, error);
        stats[resource.id] = {
          purchases: 0,
          totalEarnings: 0,
          downloads: 0,
          views: 0,
        };
      }
    }

    setUploadStats(stats);
  };

  const handleDownload = (resource) => {
    const url = `https://vmfjidjxdofmdonivzzp.supabase.co/storage/v1/object/public/resources/${resource.storage_path}`;
    window.open(url, "_blank");
  };

  const handleDeleteResource = async (resourceId) => {
    if (
      !confirm(
        "Are you sure you want to delete this resource? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId)
        .eq("uploader_id", user.id);

      if (error) throw error;

      // Refresh uploads list
      fetchUploads();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const ResourceCard = ({
    resource,
    showDownload = false,
    showStats = false,
    showDelete = false,
  }) => {
    const stats = uploadStats[resource.id] || {
      purchases: 0,
      totalEarnings: 0,
      downloads: 0,
      views: 0,
    };

    return (
      <Card className="rounded-xl hover:shadow-lg transition-shadow bg-white">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div
              className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
              onClick={() => handleDownload(resource)}
            >
              {resource.file_type?.includes("image") ? (
                <img
                  src={`https://vmfjidjxdofmdonivzzp.supabase.co/storage/v1/object/public/resources/${resource.storage_path}`}
                  alt={resource.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center"
                style={{
                  display: resource.file_type?.includes("image")
                    ? "none"
                    : "flex",
                }}
              >
                <FileText className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {resource.title}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs rounded-md">
                      {resource.department}
                    </Badge>
                    <Badge variant="outline" className="text-xs rounded-md">
                      Level {resource.level}
                    </Badge>
                    {resource.price === 0 ? (
                      <Badge
                        variant="outline"
                        className="text-xs rounded-md text-green-600 border-green-200"
                      >
                        FREE
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs rounded-md text-blue-600 border-blue-200"
                      >
                        ₦{resource.price.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                {showDelete && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteResource(resource.id);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {showStats && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">
                      {stats.downloads}
                    </p>
                    <p className="text-xs text-gray-500">Downloads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-green-600">
                      ₦{stats.totalEarnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Earned</p>
                  </div>
                </div>
              )}
              {!showStats && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-500 text-xs">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                  {showDownload && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(resource);
                      }}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your library</p>
          <Button onClick={() => onNavigate("auth")} className="mt-4">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav title="My Library" showBack onBack={() => onNavigate("home")} />
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl p-4 h-20"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav title="My Library" showBack onBack={() => onNavigate("home")} />

      <div className="p-6">
        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 bg-white">
            <TabsTrigger value="downloads" className="rounded-lg">
              <Download className="w-4 h-4 mr-2" />
              Downloads
            </TabsTrigger>
            <TabsTrigger value="uploads" className="rounded-lg">
              <Upload className="w-4 h-4 mr-2" />
              My Uploads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="mt-6">
            {downloads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No downloads yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Purchase resources to see them here
                </p>
                <Button
                  onClick={() => onNavigate("explore")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore Resources
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {downloads.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    showDownload
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="uploads" className="mt-6">
            {uploads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No uploads yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Share your knowledge by uploading resources
                </p>
                <Button
                  onClick={() => onNavigate("upload")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resource
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Overview</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {uploads.length}
                      </p>
                      <p className="text-sm text-gray-600">Resources</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ₦
                        {Object.values(uploadStats)
                          .reduce((sum, stat) => sum + stat.totalEarnings, 0)
                          .toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {Object.values(uploadStats).reduce(
                          (sum, stat) => sum + stat.downloads,
                          0,
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Downloads</p>
                    </div>
                  </div>
                </div>
                {uploads.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    showStats
                    showDelete
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
