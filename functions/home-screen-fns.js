
import { supabase } from "@/lib/supabase";

export const fetchUserStats = async (userId) => {
  try {
    // Fetch wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    // Fetch user's resources count
    const { data: resources, count: resourceCount } = await supabase
      .from("resources")
      .select("*", { count: "exact" })
      .eq("uploader_id", userId);

    // Fetch total earnings
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount")
      .eq("seller_id", userId);

    const totalEarnings = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // Fetch recent downloads
    const { data: recentDownloads } = await supabase
      .from("downloads")
      .select(`
        id,
        downloaded_at,
        resources (
          id,
          title,
          price,
          file_type
        )
      `)
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false })
      .limit(5);

    return {
      wallet: wallet || { balance: 0 },
      resourceCount: resourceCount || 0,
      totalEarnings,
      recentDownloads: recentDownloads || []
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      wallet: { balance: 0 },
      resourceCount: 0,
      totalEarnings: 0,
      recentDownloads: []
    };
  }
};

export const fetchFeaturedResources = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        description,
        price,
        department,
        level,
        file_type,
        thumbnail_path,
        download_count,
        created_at
      `)
      .eq("approved", true)
      .order("download_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching featured resources:", error);
    return [];
  }
};

export const fetchRecentResources = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        description,
        price,
        department,
        level,
        file_type,
        thumbnail_path,
        download_count,
        created_at
      `)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching recent resources:", error);
    return [];
  }
};

export const searchResources = async (query, filters = {}) => {
  try {
    let queryBuilder = supabase
      .from("resources")
      .select(`
        id,
        title,
        description,
        price,
        department,
        level,
        file_type,
        thumbnail_path,
        download_count,
        created_at
      `)
      .eq("approved", true);

    // Add text search
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Add filters
    if (filters.department) {
      queryBuilder = queryBuilder.eq("department", filters.department);
    }
    
    if (filters.level) {
      queryBuilder = queryBuilder.eq("level", filters.level);
    }
    
    if (filters.priceRange) {
      if (filters.priceRange === "free") {
        queryBuilder = queryBuilder.eq("price", 0);
      } else if (filters.priceRange === "paid") {
        queryBuilder = queryBuilder.gt("price", 0);
      }
    }

    const { data, error } = await queryBuilder
      .order("download_count", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching resources:", error);
    return [];
  }
};
