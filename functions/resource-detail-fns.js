
import { supabase } from "@/lib/supabase";

export const fetchResourceStats = async (resourceId) => {
  try {
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

    return {
      downloadCount: downloadCount || 0,
      purchaseCount: purchaseCount || 0,
      favoritesCount: favoritesCount || 0
    };
  } catch (error) {
    console.error("Error fetching resource stats:", error);
    return {
      downloadCount: 0,
      purchaseCount: 0,
      favoritesCount: 0
    };
  }
};

export const checkUserPermissions = async (userId, resourceId) => {
  try {
    // Check if user owns the resource
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .single();

    // Check if user has favorited
    const { data: favorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .single();

    // Check if user has downloaded
    const { data: download } = await supabase
      .from("downloads")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_id", resourceId)
      .single();

    return {
      hasOwnership: !!purchase,
      isFavorited: !!favorite,
      hasDownloaded: !!download
    };
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return {
      hasOwnership: false,
      isFavorited: false,
      hasDownloaded: false
    };
  }
};

export const purchaseResource = async (userId, resourceId, price) => {
  try {
    // Get user's current balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!wallet || wallet.balance < price) {
      throw new Error("Insufficient funds");
    }

    // Get resource details
    const { data: resource } = await supabase
      .from("resources")
      .select("uploader_id")
      .eq("id", resourceId)
      .single();

    if (!resource) {
      throw new Error("Resource not found");
    }

    // Process the purchase using the database function
    const { data: result, error } = await supabase.rpc('process_purchase', {
      p_buyer_id: userId,
      p_resource_id: resourceId,
      p_amount: price
    });

    if (error) throw error;

    const resultObj = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (!resultObj.success) {
      throw new Error(resultObj.error || "Purchase failed");
    }

    // Add to downloads table
    await supabase
      .from("downloads")
      .insert({
        user_id: userId,
        resource_id: resourceId,
        downloaded_at: new Date().toISOString()
      })
      .on('conflict', 'user_id,resource_id')
      .ignore();

    return { success: true, transactionId: resultObj.transaction_id };
  } catch (error) {
    console.error("Error purchasing resource:", error);
    throw error;
  }
};

export const downloadResource = async (userId, resourceId) => {
  try {
    // Record the download
    const { error } = await supabase
      .from("downloads")
      .insert({
        user_id: userId,
        resource_id: resourceId,
        downloaded_at: new Date().toISOString()
      })
      .on('conflict', 'user_id,resource_id')
      .ignore();

    if (error && !error.message.includes('duplicate')) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording download:", error);
    throw error;
  }
};

export const toggleFavorite = async (userId, resourceId, currentlyFavorited) => {
  try {
    if (currentlyFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("resource_id", resourceId);
      
      if (error) throw error;
      return { success: true, isFavorited: false };
    } else {
      // Add to favorites
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: userId,
          resource_id: resourceId
        });
      
      if (error) throw error;
      return { success: true, isFavorited: true };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};
