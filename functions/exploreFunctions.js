
import { supabase } from "@/lib/supabase";
import { checkUserDownloads } from "./utils.js";

// Fetch trending tags from resources
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

// Fetch resources with filters and search
export const fetchExploreResources = async (userId, searchQuery, filters) => {
  try {
    console.log("Fetching explore resources with filters:", filters);
    
    let query = supabase.from("resources").select("*");

    if (searchQuery) {
      // Enhanced search: title, description, and tags
      const searchTerm = searchQuery.toLowerCase();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
    }

    if (filters.departmentFilter !== "all") {
      query = query.eq("department", filters.departmentFilter);
    }

    if (filters.levelFilter !== "all") {
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

    if (data && userId) {
      // Check if user has downloaded any resources
      const resourceIds = data.map(r => r.id);
      const downloadedIds = await checkUserDownloads(userId, resourceIds);
      
      const resourcesWithDownloadStatus = data.map(resource => ({
        ...resource,
        isDownloaded: downloadedIds.has(resource.id)
      }));

      console.log("Explore resources fetched:", resourcesWithDownloadStatus.length);
      return resourcesWithDownloadStatus;
    }

    console.log("Explore resources fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching explore resources:", error);
    return [];
  }
};
