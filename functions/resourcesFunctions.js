
import { supabase } from "@/lib/supabase";

// This would be for a dedicated resources screen if needed
// Currently resource detail functionality is in resource-detail-fns.js

// Fetch all resources (admin view or general listing)
export const fetchAllResources = async (filters = {}) => {
  try {
    console.log("Fetching all resources...");
    
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.approved !== undefined) {
      query = query.eq("approved", filters.approved);
    }

    if (filters.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log("All resources fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching all resources:", error);
    return [];
  }
};

// Update resource approval status
export const updateResourceApproval = async (resourceId, approved) => {
  try {
    console.log("Updating resource approval:", resourceId, approved);
    
    const { error } = await supabase
      .from("resources")
      .update({ approved })
      .eq("id", resourceId);

    if (error) throw error;

    console.log("Resource approval updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating resource approval:", error);
    return { success: false, error: error.message };
  }
};

// Toggle resource featured status
export const toggleResourceFeatured = async (resourceId, featured) => {
  try {
    console.log("Toggling resource featured status:", resourceId, featured);
    
    const { error } = await supabase
      .from("resources")
      .update({ featured })
      .eq("id", resourceId);

    if (error) throw error;

    console.log("Resource featured status updated");
    return { success: true };
  } catch (error) {
    console.error("Error updating featured status:", error);
    return { success: false, error: error.message };
  }
};
