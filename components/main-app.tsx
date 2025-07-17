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
    const initializeApp = async () => {
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    // Handle OAuth callbacks
    const handleAuthChange = async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);

        // Check if user profile exists, if not create one
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!existingProfile && !profileCheckError?.message?.includes('No rows')) {
          try {
            // Create profile for OAuth users
            const { error: profileError } = await supabase.from("users").insert({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
              school: '',
              department: '',
              level: '',
              role: 'buyer'
            });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            } else {
              // Create wallet
              const { error: walletError } = await supabase.from("wallets").insert({
                user_id: session.user.id,
                balance: 0.00,
              });

              if (walletError) {
                console.error('Wallet creation error:', walletError);
              }
            }
          } catch (error) {
            console.error('Error creating user profile:', error);
          }
        }

        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        clearUser();
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await DatabaseService.getUserById(userId);
      setProfile(profile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      toast({
        title: "Profile Error",
        description:
          "Failed to load your profile. Some features may not work correctly.",
        variant: "destructive",
      });
    }
  };

  if (initializing) {
    return <LoadingSkeleton />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen />;
      case "explore":
        return <ExploreScreen />;
      case "library":
        return <LibraryScreen />;
      case "wallet":
        return <WalletScreen />;
      case "profile":
        return <ProfileScreen />;
      case "upload":
        return <UploadScreen />;
      case "resourceDetail":
        return <ResourceDetailScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <main className="flex-grow">
        {authError && (
          <div className="text-red-500 p-4">
            {authError}
          </div>
        )}
        {renderScreen()}
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}