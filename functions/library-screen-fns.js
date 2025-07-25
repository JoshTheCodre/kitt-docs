
import { supabase } from "@/lib/supabase";

export const fetchUserDownloads = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("downloads")
      .select(`
        id,
        downloaded_at,
        resources (
          id,
          title,
          description,
          department,
          level,
          price,
          file_type,
          storage_path,
          thumbnail_path,
          created_at
        )
      `)
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching downloads:", error);
    return [];
  }
};

export const fetchUserUploads = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        description,
        department,
        level,
        price,
        file_type,
        storage_path,
        thumbnail_path,
        download_count,
        created_at
      `)
      .eq("uploader_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return [];
  }
};

export const fetchUploadStats = async (userId) => {
  try {
    // Get user's resources
    const { data: resources } = await supabase
      .from("resources")
      .select("id, price")
      .eq("uploader_id", userId);

    if (!resources || resources.length === 0) {
      return {};
    }

    const resourceIds = resources.map(r => r.id);
    
    // Get download stats for each resource
    const stats = {};
    
    for (const resource of resources) {
      // Get downloads count
      const { data: downloads, count: downloadCount } = await supabase
        .from("downloads")
        .select("*", { count: "exact" })
        .eq("resource_id", resource.id);

      // Get earnings from transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("seller_id", userId)
        .eq("resource_id", resource.id);

      const totalEarnings = transactions?.reduce((sum, t) => sum + t.amount * 0.95, 0) || 0;

      stats[resource.id] = {
        downloads: downloadCount || 0,
        totalEarnings: totalEarnings
      };
    }

    return stats;
  } catch (error) {
    console.error("Error fetching upload stats:", error);
    return {};
  }
};

export const deleteResource = async (resourceId, userId) => {
  try {
    // Verify ownership
    const { data: resource } = await supabase
      .from("resources")
      .select("uploader_id")
      .eq("id", resourceId)
      .single();

    if (!resource || resource.uploader_id !== userId) {
      throw new Error("Unauthorized to delete this resource");
    }

    // Delete the resource (cascade will handle related records)
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId)
      .eq("uploader_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource:", error);
    throw error;
  }
};
