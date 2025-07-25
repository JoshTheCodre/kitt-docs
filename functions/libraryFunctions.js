
import { supabase } from "@/lib/supabase";

// Fetch user's downloaded resources
export const fetchUserDownloads = async (userId) => {
  try {
    console.log("Fetching user downloads for:", userId);
    
    const { data, error } = await supabase
      .from("downloads")
      .select(`
        id,
        downloaded_at,
        resources (
          id,
          title,
          department,
          level,
          price,
          file_type,
          storage_path,
          preview_path,
          created_at
        )
      `)
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false });

    if (error) throw error;

    const resources = data?.map((item) => item.resources).filter(Boolean) || [];
    console.log("Downloads fetched:", resources.length);
    return resources;
  } catch (error) {
    console.error("Error fetching downloads:", error);
    return [];
  }
};

// Fetch user's uploaded resources
export const fetchUserUploads = async (userId) => {
  try {
    console.log("Fetching user uploads for:", userId);
    
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("uploader_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("Uploads fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return [];
  }
};

// Fetch upload statistics for resources
export const fetchUploadStats = async (resources) => {
  const stats = {};

  for (const resource of resources) {
    try {
      console.log("Fetching stats for resource:", resource.id);
      
      // Get purchase count and total earnings
      const { data: purchases } = await supabase
        .from("transactions")
        .select("amount")
        .eq("resource_id", resource.id);

      // Get download count
      const { data: downloads } = await supabase
        .from("downloads")
        .select("id")
        .eq("resource_id", resource.id);

      // Get view count (simulated for now)
      const viewCount = Math.floor(Math.random() * 1000) + 50;

      stats[resource.id] = {
        purchases: purchases?.length || 0,
        totalEarnings: purchases?.reduce((sum, p) => sum + p.amount * 0.9, 0) || 0,
        downloads: downloads?.length || 0,
        views: viewCount,
      };
    } catch (error) {
      console.error("Error fetching stats for resource:", resource.id, error);
      stats[resource.id] = {
        purchases: 0,
        totalEarnings: 0,
        downloads: 0,
        views: 0,
      };
    }
  }

  return stats;
};

// Handle resource download
export const handleResourceDownload = (resource) => {
  console.log("Downloading resource:", resource.title);
  const url = `https://vmfjidjxdofmdonivzzp.supabase.co/storage/v1/object/public/resources/${resource.storage_path}`;
  window.open(url, "_blank");
};

// Delete a resource
export const deleteUserResource = async (resourceId, userId) => {
  try {
    console.log("Deleting resource:", resourceId);
    
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId)
      .eq("uploader_id", userId);

    if (error) throw error;

    console.log("Resource deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
};
