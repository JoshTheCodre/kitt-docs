
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Heart,
  Share,
  Sparkles,
  Shield,
  Clock,
  Users,
  Star,
  Flame,
  BarChart3,
  Eye,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ShareMaterialModal from "@/components/share-material-modal";
import FilePreview from "@/components/file-preview";
import {
  fetchResourceStats,
  checkUserPermissions,
  purchaseResource,
  downloadResource,
  toggleFavorite,
} from "@/functions/resource-detail-fns";

export default function ResourceDetailScreen({
  user,
  resource,
  onNavigate,
  onBack,
}) {
  const [loading, setLoading] = useState(false);
  const [userWallet, setUserWallet] = useState(null);
  const [permissions, setPermissions] = useState({
    hasOwnership: false,
    isFavorited: false,
    hasDownloaded: false,
  });
  const [stats, setStats] = useState({
    downloadCount: 0,
    purchaseCount: 0,
    favoritesCount: 0,
  });
  const [ownerStats, setOwnerStats] = useState({
    totalEarnings: 0,
    totalPurchases: 0,
    totalViews: 0,
    recentActivity: [],
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();

  const isOwner = user?.id === resource?.uploader_id;

  useEffect(() => {
    if (!user?.id || !resource?.id) return;
    
    console.log("Initializing resource detail screen for:", resource.title);
    initializeData();
  }, [user?.id, resource?.id]);

  const initializeData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [walletData, permissionsData, statsData] = await Promise.all([
        fetchUserWallet(),
        checkUserPermissions(user.id, resource.id),
        fetchResourceStats(resource.id),
      ]);

      setUserWallet(walletData);
      setPermissions(permissionsData);
      setStats(statsData);

      // Fetch owner-specific stats if user is the owner
      if (isOwner) {
        await fetchOwnerStats();
      }

      console.log("Resource data initialized successfully");
    } catch (error) {
      console.error("Error initializing resource data:", error);
      toast({
        title: "Error loading resource 😅",
        description: "Please refresh and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWallet = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      
      console.log("User wallet balance:", data?.balance || 0);
      return data;
    } catch (error) {
      console.error("Error fetching wallet:", error);
      return null;
    }
  };

  const fetchOwnerStats = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      
      // Fetch transactions for earnings
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("resource_id", resource.id);

      // Fetch recent activity with user profiles
      const { data: recentActivity } = await supabase
        .from("transactions")
        .select(`
          *,
          users!buyer_id (
            name,
            email
          )
        `)
        .eq("resource_id", resource.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const totalEarnings = transactions?.reduce((sum, t) => sum + t.amount * 0.9, 0) || 0;
      const totalPurchases = transactions?.length || 0;
      
      setOwnerStats({
        totalEarnings,
        totalPurchases,
        totalViews: stats.downloadCount, // Using downloads as proxy for views
        recentActivity: recentActivity || [],
      });

      console.log("Owner stats loaded:", { totalEarnings, totalPurchases });
    } catch (error) {
      console.error("Error fetching owner stats:", error);
    }
  };

  const handleDownload = async () => {
    // Check if user needs to purchase first
    if (resource.price > 0 && !permissions.hasOwnership) {
      toast({
        title: "Hold up! 🛑",
        description: "You need to purchase this resource first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting download for resource:", resource.id);
      
      // Record download in database
      await downloadResource(user.id, resource.id);

      // Trigger actual file download
      const url = `https://vmfjidjxdofmdonivzzp.supabase.co/storage/v1/object/public/resources/${resource.storage_path}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = resource.title || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log("Download completed successfully");
      toast({
        title: "Downloaded! 🎉",
        description: "Your resource is ready to slay!",
      });

      // Refresh stats
      const newStats = await fetchResourceStats(resource.id);
      setStats(newStats);
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed 😭",
        description: "Try again bestie",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!userWallet || userWallet.balance < resource.price) {
      toast({
        title: "Insufficient funds 💸",
        description: "Time to add some coins to your wallet!",
        variant: "destructive",
      });
      onNavigate("wallet");
      return;
    }

    setLoading(true);
    try {
      console.log("Processing purchase for resource:", resource.id, "Amount:", resource.price);
      
      await purchaseResource(user.id, resource.id, resource.price);

      // Update local state
      setPermissions(prev => ({ ...prev, hasOwnership: true }));
      await fetchUserWallet().then(setUserWallet);

      console.log("Purchase completed successfully");
      toast({
        title: "Purchase successful! 🎊",
        description: "You now own this resource! Time to download it!",
      });
    } catch (error) {
      console.error("Purchase failed:", error);
      toast({
        title: "Purchase failed 😬",
        description: error.message || "Something went wrong. Try again!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      console.log("Toggling favorite status for resource:", resource.id);
      
      const result = await toggleFavorite(user.id, resource.id, permissions.isFavorited);
      
      setPermissions(prev => ({ ...prev, isFavorited: result.isFavorited }));
      
      toast({
        title: result.isFavorited ? "Added to favorites! 💖" : "Removed from favorites 💔",
        description: result.isFavorited ? "Added to your collection!" : "No longer in your favs!",
      });

      console.log("Favorite toggled successfully:", result.isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Action failed 😅",
        description: "Try again bestie",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      console.log("Sharing resource:", resource.id);
      
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
          title: "Link Copied! 📋",
          description: "Resource link copied to clipboard.",
        });
      }

      // Record share analytics
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("shares").insert({
        user_id: user.id,
        resource_id: resource.id,
      });

      console.log("Resource shared successfully");
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        title: "Share Failed 😅",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hasAccess = resource.price === 0 || permissions.hasOwnership;

  if (loading && !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resource...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Floating Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="rounded-full w-10 h-10 p-0 hover:bg-purple-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className={`rounded-full w-10 h-10 p-0 ${
                permissions.isFavorited ? "bg-red-100 hover:bg-red-200" : "hover:bg-pink-100"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  permissions.isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="rounded-full w-10 h-10 p-0 hover:bg-blue-100"
            >
              <Share className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-300">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            {resource.price === 0 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                FREE
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              {resource.title}
            </h1>
            {resource.description && (
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                {resource.description}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center justify-center space-x-2 flex-wrap">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 rounded-full px-3 py-1">
              {resource.department}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-3 py-1">
              Level {resource.level}
            </Badge>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 rounded-full px-3 py-1">
              <Flame className="w-3 h-3 mr-1" />
              {stats.downloadCount} downloads
            </Badge>
          </div>
        </div>

        {/* Owner Stats - Only show if user is the owner */}
        {isOwner && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Earnings</p>
                      <p className="text-2xl font-bold">{formatCurrency(ownerStats.totalEarnings)}</p>
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
                      <p className="text-2xl font-bold">{ownerStats.totalPurchases}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {ownerStats.recentActivity.length > 0 && (
              <Card className="bg-white/90 backdrop-blur border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Users className="w-5 h-5 mr-2" />
                    Recent Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ownerStats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {activity.users?.name || "Unknown User"}
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

        {/* Price Card - Show for non-owners */}
        {!isOwner && (
          <Card className="bg-gradient-to-br from-white to-purple-50 border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  {/* <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">
                    {resource.price === 0 ? "Completely Free! 🎉" : "Price"}
                  </p> */}
                  <div className="text-5xl font-black text-gray-900">
                    {resource.price === 0 ? (
                      <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        FREE
                      </span>
                    ) : (
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatCurrency(resource.price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="space-y-3">
                  {resource.price === 0 ? (
                    <Button
                      onClick={handleDownload}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {loading ? "Downloading..." : "Download Free! "}
                    </Button>
                  ) : permissions.hasOwnership ? (
                    <Button
                      onClick={handleDownload}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {loading ? "Downloading..." : "Download Now!"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePurchase}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      {loading ? "Processing..." : `Purchase for ${formatCurrency(resource.price)} 💳`}
                    </Button>
                  )}

                  {userWallet && resource.price > 0 && !permissions.hasOwnership && (
                    <p className="text-sm text-gray-600">
                      💰 Your balance: {formatCurrency(userWallet.balance)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Preview Section */}
        {/* <FilePreview 
          resource={resource}
          onDownload={handleDownload}
          canPreview={hasAccess}
        /> */}

 

        {/* Upload Info */}
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Quality Content</h3>
              <p className="text-gray-600 text-sm">
                Uploaded {formatDate(resource.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Modal */}
      <ShareMaterialModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resource={resource}
      />
    </div>
  );
}
