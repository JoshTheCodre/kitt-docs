
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Heart,
  Share,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Users,
  Star,
  Flame,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ShareMaterialModal from "@/components/share-material-modal";

export default function ResourceDetailScreen({
  user,
  resource,
  onNavigate,
  onBack,
}) {
  const [loading, setLoading] = useState(false);
  const [userWallet, setUserWallet] = useState(null);
  const [isOwned, setIsOwned] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id || !resource?.id) return;
    fetchUserWallet();
    checkOwnership();
    checkFavorite();
    fetchStats();
  }, [user?.id, resource?.id]);

  const fetchUserWallet = async () => {
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (data) setUserWallet(data);
  };

  const checkOwnership = async () => {
    const { data } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("resource_id", resource.id)
      .single();

    setIsOwned(!!data);
  };

  const checkFavorite = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("resource_id", resource.id)
      .single();

    setIsFavorited(!!data);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from("downloads")
      .select("id")
      .eq("resource_id", resource.id);

    setDownloadCount(data?.length || 0);
  };

  const handleDownload = async () => {
    if (resource.price > 0 && !isOwned) {
      toast({
        title: "Hold up! 🛑",
        description: "You need to purchase this resource first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existingDownload } = await supabase
        .from("downloads")
        .select("id")
        .eq("user_id", user.id)
        .eq("resource_id", resource.id)
        .single();

      if (!existingDownload) {
        await supabase.from("downloads").insert({
          user_id: user.id,
          resource_id: resource.id,
          downloaded_at: new Date().toISOString(),
        });
      }

      let url = `https://vmfjidjxdofmdonivzzp.supabase.co/storage/v1/object/public/resources/${resource.storage_path}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = resource.title || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Downloaded! 🎉",
        description: "Your resource is ready to slay!",
      });
    } catch (error) {
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
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          resource_id: resource.id,
          price_paid: resource.price,
          purchased_at: new Date().toISOString(),
        });

      if (purchaseError) throw purchaseError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          buyer_id: user.id,
          seller_id: resource.uploader_id,
          resource_id: resource.id,
          amount: resource.price,
          transaction_type: 'purchase',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (transactionError) throw transactionError;

      // Update buyer's wallet
      const { error: buyerWalletError } = await supabase
        .from("wallets")
        .update({ balance: userWallet.balance - resource.price })
        .eq("user_id", user.id);

      if (buyerWalletError) throw buyerWalletError;

      // Update seller's wallet
      const sellerEarnings = resource.price * 0.9;
      const { error: sellerWalletError } = await supabase.rpc('increment_wallet_balance', {
        user_id_param: resource.uploader_id,
        amount_param: sellerEarnings,
      });

      if (sellerWalletError) console.error("Error updating seller wallet:", sellerWalletError);

      // Add to downloads
      await supabase.from("downloads").insert({
        user_id: user.id,
        resource_id: resource.id,
        downloaded_at: new Date().toISOString(),
      });

      setIsOwned(true);
      await fetchUserWallet();
      toast({
        title: "Purchase successful! 🎊",
        description: "You now own this resource! Time to download it!",
      });
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase failed 😬",
        description: "Something went wrong. Try again!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resource.id);
        setIsFavorited(false);
        toast({
          title: "Removed from favorites 💔",
          description: "No longer in your favs!",
        });
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          resource_id: resource.id,
        });
        setIsFavorited(true);
        toast({
          title: "Added to favorites! 💖",
          description: "Added to your collection!",
        });
      }
    } catch (error) {
      toast({
        title: "Action failed 😅",
        description: "Try again bestie",
        variant: "destructive",
      });
    }
  };

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
              onClick={toggleFavorite}
              className={`rounded-full w-10 h-10 p-0 ${
                isFavorited ? "bg-red-100 hover:bg-red-200" : "hover:bg-pink-100"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareModal(true)}
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
              {downloadCount} downloads
            </Badge>
          </div>
        </div>

        {/* Price Card */}
        <Card className="bg-gradient-to-br from-white to-purple-50 border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">
                  {resource.price === 0 ? "Completely Free! 🎉" : "Price"}
                </p>
                <div className="text-5xl font-black text-gray-900">
                  {resource.price === 0 ? (
                    <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                      FREE
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₦{resource.price.toLocaleString()}
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
                ) : isOwned ? (
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
                    {loading ? "Processing..." : `Purchase for ₦${resource.price.toLocaleString()} 💳`}
                  </Button>
                )}
                
                {userWallet && resource.price > 0 && !isOwned && (
                  <p className="text-sm text-gray-600">
                    💰 Your balance: ₦{userWallet.balance.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Verified</h3>
              <p className="text-gray-600 text-xs">Safe & Secure ✅</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Instant</h3>
              <p className="text-gray-600 text-xs">Download Now 📥</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Popular</h3>
              <p className="text-gray-600 text-xs">{downloadCount} downloads</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Info */}
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900">Quality Content</h3>
              <p className="text-gray-600 text-sm">
                Uploaded {new Date(resource.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
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
