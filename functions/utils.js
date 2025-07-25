
import { supabase } from "@/lib/supabase";

// Format currency amount
export const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

// Format date for display
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format file size in bytes to human readable
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};

// Get greeting based on time of day
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Get initials from name
export const getInitials = (name) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Check if user has downloaded a resource
export const checkUserDownloads = async (userId, resourceIds) => {
  try {
    console.log("Checking user downloads for resources:", resourceIds.length);
    
    const { data: transactions } = await supabase
      .from("transactions")
      .select("resource_id")
      .eq("buyer_id", userId)
      .in("resource_id", resourceIds);

    const downloadedIds = new Set(transactions?.map(t => t.resource_id) || []);
    
    console.log("Found downloaded resources:", downloadedIds.size);
    return downloadedIds;
  } catch (error) {
    console.error("Error checking user downloads:", error);
    return new Set();
  }
};

// Generic error handler
export const handleError = (error, defaultMessage = "An error occurred") => {
  console.error("Error:", error);
  return error.message || defaultMessage;
};

// Validate file upload
export const validateFile = (file, maxSize = 10 * 1024 * 1024) => {
  if (!file) return { valid: false, error: "No file selected" };
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${formatFileSize(maxSize)}` 
    };
  }
  
  const allowedTypes = [
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg", 
    "image/png", 
    "image/jpg"
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: "Invalid file type. Please upload PDF, DOC, PPT, or image files." 
    };
  }
  
  return { valid: true };
};
