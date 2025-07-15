"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  DollarSign,
  FileText,
  Star,
  Heart,
  ShoppingCart,
  Trophy,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function ResourceDetailsScreen({ user, resource, onNavigate, onBack }) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalPurchases: 0,
    totalViews: 0,
    totalShares: 0,
    averageRating: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkOwnership();
    if (user.id === resource.uploader_id) {
      fetchResourceStats();
    }
  }, [user.id, resource.id]);

  const checkOwnership = () => {
    setIsOwner(user.id === resource.uploader_id);
  };

  const fetchResourceStats = async () => {
    setLoading(true);
    try {
      // Fetch transactions (purchases)
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("resource_id", resource.id);

      // Fetch downloads
      const { data: downloads } = await supabase
        .from("downloads")
        .select("*")
        .eq("resource_id", resource.id);

      // Fetch shares (you might need to create this table)
      const { data: shares } = await supabase
        .from("shares")
        .select("*")
        .eq("resource_id", resource.id);

      // Calculate stats
      const totalEarnings = transactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
      const totalPurchases = transactions?.length || 0;
      const totalViews = downloads?.length || 0; // You might want a separate views table
      const totalShares = shares?.length || 0;

      // Fetch recent activity (last 10 purchases)
      const { data: recentActivity } = await supabase
        .from("transactions")
        .select(`
          *,
          profiles!buyer_id (
            first_name,
            last_name
          )
        `)
        .eq("resource_id", resource.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalEarnings,
        totalPurchases,
        totalViews,
        totalShares,
        averageRating: 4.8, // You can calculate this from a ratings table
        recentActivity: recentActivity || []
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/resource/${resource.id}`;

      if (navigator.share) {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Resource link copied to clipboard.",
        });
      }

      // Record share analytics
      await supabase.from("shares").insert({
        user_id: user.id,
        resource_id: resource.id,
      });

    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="rounded-lg"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Resource Header */}
        <Card className="bg-white/90 backdrop-blur border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant="secondary" className="rounded-lg">
                    {resource.department}
                  </Badge>
                  <Badge variant="outline" className="rounded-lg">
                    Level {resource.level}
                  </Badge>
                  {resource.price === 0 ? (
                    <Badge variant="outline" className="rounded-lg text-green-600 border-green-200">
                      FREE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-lg text-blue-600 border-blue-200">
                      {formatCurrency(resource.price)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  Uploaded {formatDate(resource.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Stats - Only show if user is the owner */}
        {isOwner && (
          <>
            {/* Revenue & Performance Overview */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Earnings</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Sales</p>
                      <p className="text-2xl font-bold">{stats.totalPurchases}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/90 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Views</p>
                      <p className="text-xl font-bold text-gray-900">{stats.totalViews}</p>
                    </div>
                    <Eye className="w-6 h-6 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Shares</p>
                      <p className="text-xl font-bold text-gray-900">{stats.totalShares}</p>
                    </div>
                    <Share2 className="w-6 h-6 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Average Rating</div>
                      <div className="text-gray-600 text-sm">{stats.averageRating}/5.0</div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(stats.averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Conversion Rate</div>
                      <div className="text-gray-600 text-sm">
                        {stats.totalViews > 0 ? ((stats.totalPurchases / stats.totalViews) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    {stats.totalPurchases > 10 ? "High Performer" : "Growing"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {stats.recentActivity.length > 0 && (
              <Card className="bg-white/90 backdrop-blur border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Users className="w-5 h-5 mr-2" />
                    Recent Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {activity.profiles?.first_name} {activity.profiles?.last_name}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {formatDate(activity.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-green-600 font-semibold">
                          {formatCurrency(activity.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Description - Show for all users */}
        {resource.description && (
          <Card className="bg-white/90 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">About This Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{resource.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!isOwner && (
            <Button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12"
              onClick={() => onNavigate(`resource/${resource.id}`)}
            >
              <Eye className="w-5 h-5 mr-2" />
              View Details
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-12"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}