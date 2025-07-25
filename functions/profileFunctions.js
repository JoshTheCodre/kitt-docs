
import { supabase } from "@/lib/supabase";
import { getUserTier } from "@/lib/tier-system";

// Fetch complete user profile
export const fetchUserProfile = async (userId) => {
  try {
    console.log("Fetching complete user profile for:", userId);
    
    const { data, error } = await supabase
      .from("users")
      .select("name, email, school, department, level")
      .eq("id", userId)
      .single();

    if (error) throw error;
    
    console.log("Complete user profile fetched:", data?.name);
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Fetch user statistics (uploads, downloads, earnings)
export const fetchUserStats = async (userId) => {
  try {
    console.log("Fetching user stats for:", userId);
    
    // Fetch uploads count
    const { count: uploadsCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("uploader_id", userId);

    // Fetch downloads count
    const { count: downloadsCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", userId);

    // Calculate earnings (sum of all sales)
    const { data: salesData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("buyer_id", userId);

    const totalEarnings = salesData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    const stats = {
      uploads: uploadsCount || 0,
      downloads: downloadsCount || 0,
      earnings: totalEarnings,
    };

    console.log("User stats fetched:", stats);
    return stats;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { uploads: 0, downloads: 0, earnings: 0 };
  }
};

// Fetch user tier information
export const fetchUserTierInfo = async (userId) => {
  try {
    console.log("Fetching user tier info for:", userId);
    
    const { count: uploadCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("uploader_id", userId);

    const tier = getUserTier(uploadCount || 0);
    
    console.log("User tier info fetched:", tier);
    return tier;
  } catch (error) {
    console.error("Error fetching user tier info:", error);
    return null;
  }
};

// Handle user sign out
export const handleUserSignOut = async () => {
  try {
    console.log("Signing out user...");
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // Clear any localStorage or sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app-storage');
      sessionStorage.clear();
    }

    console.log("User signed out successfully");
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message };
  }
};
