
import { supabase } from "@/lib/supabase";

// Fetch all resources with filters
export const fetchExploreResources = async (filters = {}) => {
  try {
    console.log("Fetching explore resources with filters:", filters);
    
    let query = supabase.from("resources").select("*");

    if (filters.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
    }

    if (filters.departmentFilter && filters.departmentFilter !== "all") {
      query = query.eq("department", filters.departmentFilter);
    }

    if (filters.levelFilter && filters.levelFilter !== "all") {
      query = query.eq("level", filters.levelFilter);
    }

    if (filters.priceFilter === "free") {
      query = query.eq("price", 0);
    } else if (filters.priceFilter === "paid") {
      query = query.gt("price", 0);
    }

    if (filters.verifiedFilter === "verified") {
      query = query.eq("verified", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    console.log("Resources fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching explore resources:", error);
    return [];
  }
};

// Check which resources user has downloaded
export const checkUserDownloadedResources = async (userId, resources) => {
  if (!userId) return resources;
  
  try {
    console.log("Checking downloaded resources for user:", userId);
    
    const { data: transactions } = await supabase
      .from("transactions")
      .select("resource_id")
      .eq("buyer_id", userId);

    const downloadedIds = new Set(transactions?.map(t => t.resource_id) || []);

    return resources.map(resource => ({
      ...resource,
      isDownloaded: downloadedIds.has(resource.id)
    }));
  } catch (error) {
    console.error("Error checking downloaded resources:", error);
    return resources;
  }
};

// Fetch trending tags
export const fetchTrendingTags = async () => {
  try {
    console.log("Fetching trending tags...");
    
    const { data } = await supabase
      .from("resources")
      .select("tags")
      .not("tags", "is", null)
      .limit(20);

    if (data) {
      // Extract and count all tags
      const tagCounts = {};
      data.forEach(resource => {
        resource.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Sort by frequency and take top 5
      const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      console.log("Trending tags fetched:", sortedTags);
      return sortedTags;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching trending tags:", error);
    return [];
  }
};
