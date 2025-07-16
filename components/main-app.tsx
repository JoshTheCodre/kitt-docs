"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useStore from "@/store/useStore";
import DatabaseService from "@/lib/database";
import HomeScreen from "@/components/screens/home-screen";
import ExploreScreen from "@/components/screens/explore-screen";
import LibraryScreen from "@/components/screens/library-screen";
import WalletScreen from "@/components/screens/wallet-screen";
import ProfileScreen from "@/components/screens/profile-screen";
import UploadScreen from "@/components/screens/upload-screen";
import ResourceDetailScreen from "@/components/screens/resource-detail-screen";
import BottomNav from "@/components/bottom-nav";
import TopNav from "@/components/top-nav";
import LoadingSkeleton from "@/components/loading-skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: any;
}

interface MainAppProps {
  user: SupabaseUser
}

export default function MainApp({ user }: MainAppProps) {
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    currentScreen, 
    setUser, 
    setProfile, 
    setWallet,
    setLoading,
    clearUser
  } = useStore();

useEffect(() => {
    if (user) {
      initializeUserData();
    } else {
      setInitializing(false);
    }
  }, [user]);

  const initializeUserData = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      setUser(user);

      // Get user profile with retry logic
      let profile;
      try {
        profile = await DatabaseService.getUserById(user.id);
        setProfile(profile);
      } catch (profileError) {
        console.error('Profile fetch error:', profileError);
        setAuthError('Failed to load user profile');
        toast({
          title: "Profile Error",
          description: "Failed to load your profile. Some features may not work correctly.",
          variant: "destructive",
        });
      }

      // Get user wallet with retry logic
      try {
        const wallet = await DatabaseService.getUserWallet(user.id);
        setWallet(wallet);
      } catch (walletError) {
        console.error('Wallet fetch error:', walletError);
        setAuthError('Failed to load wallet');
        toast({
          title: "Wallet Error", 
          description: "Failed to load your wallet. Please refresh the page.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      setAuthError('Failed to initialize user data');
      toast({
        title: "Initialization Error",
        description: "Failed to load your account data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };
}