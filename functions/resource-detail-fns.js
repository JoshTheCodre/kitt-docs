
import { supabase } from "@/lib/supabase";

// Fetch comprehensive resource statistics
export const fetchResourceStats = async (resourceId) => {
  try {
    console.log("Fetching stats for resource:", resourceId);
    
    // Fetch download count
    const { data: downloads, count: downloadCount } = await supabase
      .from("downloads")
      .select("*", { count: "exact" })
      .eq("resource_id", resourceId);

    // Fetch purchase count
    const { data: purchases, count: purchaseCount } = await supabase
      .from("purchases")
      .select("*", { count: "exact" })
      .eq("resource_id", resourceId);

    // Fetch favorites count
    const { data: favorites, count: favoritesCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact" })
      .eq("resource_id", resourceId);

    const stats = {
      downloadCount: downloadCount || 0,
      purchaseCount: purchaseCount || 0,
      favoritesCount: favoritesCount || 0
    };

    console.log("Resource stats fetched successfully:", stats);
    return stats;
  } catch (error) {
    console.error("Error fetching resource stats:", error);
    return {
      downloadCount: 0,
      purchaseCount: 0,
      favoritesCount: 0
    };
  }
};

// Check user permissions for a resource
export const checkUserPermissions = async (userId, resourceId) => {
  try {
    console.log("Checking permissions for user:", userId, "resource:", resourceId);
    
    // Check if user owns the resource (has purchased it)
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .single();

    // Check if user has favorited the resource
    const { data: favorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .single();

    // Check if user has downloaded the resource
    const { data: download } = await supabase
      .from("downloads")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .single();

    const permissions = {
      hasOwnership: !!purchase,
      isFavorited: !!favorite,
      hasDownloaded: !!download
    };

    console.log("User permissions checked:", permissions);
    return permissions;
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return {
      hasOwnership: false,
      isFavorited: false,
      hasDownloaded: false
    };
  }
};

// Handle resource purchase transaction
export const purchaseResource = async (userId, resourceId, price) => {
  try {
    console.log("Processing purchase:", { userId, resourceId, price });
    
    // Get user's current wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!wallet || wallet.balance < price) {
      throw new Error("Insufficient funds");
    }

    // Get resource details for seller info
    const { data: resource } = await supabase
      .from("resources")
      .select("uploader_id")
      .eq("id", resourceId)
      .single();

    if (!resource) {
      throw new Error("Resource not found");
    }

    // Use database function for transaction processing
    const { data: result, error } = await supabase.rpc('process_purchase', {
      p_buyer_id: userId,
      p_resource_id: resourceId,
      p_amount: price
    });

    if (error) {
      console.error("Purchase RPC error:", error);
      throw error;
    }

    const resultObj = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (!resultObj.success) {
      throw new Error(resultObj.error || "Purchase failed");
    }

    // Add to downloads table for immediate access
    await supabase
      .from("downloads")
      .insert({
        user_id: userId,
        resource_id: resourceId,
        downloaded_at: new Date().toISOString()
      })
      .on('conflict', 'user_id,resource_id')
      .ignore();

    console.log("Purchase completed successfully:", resultObj.transaction_id);
    return { success: true, transactionId: resultObj.transaction_id };
  } catch (error) {
    console.error("Error processing purchase:", error);
    throw error;
  }
};

// Record resource download
export const downloadResource = async (userId, resourceId) => {
  try {
    console.log("Recording download for user:", userId, "resource:", resourceId);
    
    // Insert or update download record
    const { data, error } = await supabase
      .from("downloads")
      .upsert({
        user_id: userId,
        resource_id: resourceId,
        downloaded_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,resource_id'
      });

    if (error && !error.message.includes('duplicate')) {
      throw error;
    }

    console.log("Download recorded successfully");
    return { success: true };
  } catch (error) {
    console.error("Error recording download:", error);
    throw error;
  }
};

// Toggle favorite status for resource
export const toggleFavorite = async (userId, resourceId, currentlyFavorited) => {
  try {
    console.log("Toggling favorite:", { userId, resourceId, currentlyFavorited });
    
    if (currentlyFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("resource_id", resourceId);
      
      if (error) throw error;
      
      console.log("Removed from favorites successfully");
      return { success: true, isFavorited: false };
    } else {
      // Add to favorites
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: userId,
          resource_id: resourceId,
          favorited_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      console.log("Added to favorites successfully");
      return { success: true, isFavorited: true };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

// Fetch user's wallet information
export const fetchUserWallet = async (userId) => {
  try {
    console.log("Fetching wallet for user:", userId);
    
    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If wallet doesn't exist, create one
      if (error.code === 'PGRST116') {
        console.log("Creating new wallet for user:", userId);
        
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: userId, balance: 0 })
          .select("balance")
          .single();

        if (createError) throw createError;
        
        console.log("New wallet created successfully");
        return newWallet;
      }
      throw error;
    }

    console.log("Wallet fetched successfully:", data.balance);
    return data;
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return null;
  }
};

// Update resource views/analytics
export const recordResourceView = async (userId, resourceId) => {
  try {
    console.log("Recording view for resource:", resourceId);
    
    // Insert view record (you might need to create a views table)
    const { error } = await supabase
      .from("resource_views")
      .insert({
        user_id: userId,
        resource_id: resourceId,
        viewed_at: new Date().toISOString()
      });

    // Don't throw error if table doesn't exist yet
    if (error && !error.message.includes('relation "resource_views" does not exist')) {
      console.error("Error recording view:", error);
    } else {
      console.log("View recorded successfully");
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording resource view:", error);
    return { success: false };
  }
};

// Delete a resource (for owners)
export const deleteResource = async (resourceId, userId) => {
  try {
    console.log("Deleting resource:", resourceId, "by user:", userId);
    
    // Verify ownership before deletion
    const { data: resource } = await supabase
      .from("resources")
      .select("uploader_id")
      .eq("id", resourceId)
      .single();

    if (!resource || resource.uploader_id !== userId) {
      throw new Error("Unauthorized: You can only delete your own resources");
    }

    // Delete the resource
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId)
      .eq("uploader_id", userId);

    if (error) throw error;

    console.log("Resource deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource:", error);
    throw error;
  }
};

// Share resource and record analytics
export const shareResource = async (userId, resourceId, shareMethod = 'link') => {
  try {
    console.log("Recording share for resource:", resourceId, "method:", shareMethod);
    
    // Record share in analytics (create table if needed)
    const { error } = await supabase
      .from("resource_shares")
      .insert({
        user_id: userId,
        resource_id: resourceId,
        share_method: shareMethod,
        shared_at: new Date().toISOString()
      });

    if (error && !error.message.includes('relation "resource_shares" does not exist')) {
      console.error("Error recording share:", error);
    } else {
      console.log("Share recorded successfully");
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording share:", error);
    return { success: false };
  }
};
