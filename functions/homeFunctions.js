
import { supabase } from "@/lib/supabase";

// Fetch user profile information
export const fetchUserProfile = async (userId) => {
  try {
    console.log("Fetching user profile for:", userId);
    
    const { data, error } = await supabase
      .from("users")
      .select("name, school, department, level")
      .eq("id", userId)
      .single();

    if (error) throw error;
    
    console.log("User profile fetched:", data?.name);
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Fetch personalized resources based on user's department and level
export const fetchForYouResources = async (profile) => {
  if (!profile) {
    console.log("No profile provided for personalized resources");
    return [];
  }

  try {
    console.log("Fetching personalized resources for:", profile.department, "Level", profile.level);
    
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("department", profile.department)
      .eq("level", profile.level)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;

    console.log("Personalized resources fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching personalized resources:", error);
    return [];
  }
};

// Fetch featured resources for home display
export const fetchFeaturedResources = async () => {
  try {
    console.log("Fetching featured resources...");
    
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    console.log("Featured resources fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching featured resources:", error);
    return [];
  }
};

// Search resources from home screen
export const searchResourcesFromHome = async (query, filters = {}) => {
  try {
    console.log("Searching resources from home:", query);
    
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

    console.log("Search results:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error searching resources:", error);
    return [];
  }
};
