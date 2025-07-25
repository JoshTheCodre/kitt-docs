
import { supabase } from "@/lib/supabase";
import { getUserTier, getTierInfo, canUserUpload, getPriceSuggestions } from "@/lib/tier-system";

// Fetch user tier information for upload limits
export const fetchUserTierForUpload = async (userId) => {
  try {
    console.log("Fetching user tier for upload:", userId);
    
    const tier = await getUserTier(userId);
    const tierInfo = getTierInfo(tier);
    
    console.log("User tier info:", tierInfo);
    return { tier, tierInfo };
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return { tier: 1, tierInfo: getTierInfo(1) };
  }
};

// Check user's current upload count
export const fetchUserUploadCount = async (userId) => {
  try {
    console.log("Fetching user upload count:", userId);
    
    const { data, error } = await supabase
      .from("resources")
      .select("*", { count: "exact" })
      .eq("uploader_id", userId);

    if (error) throw error;

    const count = data?.length || 0;
    console.log("User upload count:", count);
    return count;
  } catch (error) {
    console.error("Error fetching upload count:", error);
    return 0;
  }
};

// Validate file before upload
export const validateUploadFile = (file, maxSize = 10 * 1024 * 1024) => {
  console.log("Validating file:", file?.name);
  
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
  
  console.log("File validation passed");
  return { valid: true };
};

// Generate preview image for uploaded file
export const generateFilePreview = async (file) => {
  if (typeof window === "undefined") return null;
  
  console.log("Generating preview for:", file.type);
  
  if (file.type === "application/pdf") {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const fileUrl = URL.createObjectURL(file);
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;
      const page = await pdf.getPage(1);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;

      // Apply rules based on page count
      if (pdf.numPages === 1) {
        cropCanvas(canvas, 0, 0, canvas.width, canvas.height * 0.3);
      } else if (pdf.numPages <= 5) {
        cropCanvas(canvas, 0, 0, canvas.width, canvas.height * 0.6);
      } else {
        context.globalAlpha = 0.5;
        context.fillStyle = "rgba(255,255,255,0.5)";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.7),
      );
      
      console.log("PDF preview generated");
      return blob;
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      return null;
    }
  } else if (file.type.startsWith("image/")) {
    try {
      const img = new window.Image();
      const fileUrl = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = fileUrl;
      });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height * 0.2; // Crop 80%
      context.drawImage(
        img,
        0,
        0,
        img.width,
        img.height * 0.2,
        0,
        0,
        img.width,
        img.height * 0.2,
      );
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.5),
      );
      
      console.log("Image preview generated");
      return blob;
    } catch (error) {
      console.error("Error generating image preview:", error);
      return null;
    }
  }
  return null;
};

// Upload file to storage
export const uploadFileToStorage = async (file, filePath) => {
  try {
    console.log("Uploading file to storage:", filePath);
    
    const { error } = await supabase.storage
      .from("resources")
      .upload(filePath, file);

    if (error) throw error;

    console.log("File uploaded successfully");
    return { success: true };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }
};

// Upload preview to storage
export const uploadPreviewToStorage = async (previewBlob, previewPath) => {
  try {
    console.log("Uploading preview to storage:", previewPath);
    
    const { error } = await supabase.storage
      .from("previews")
      .upload(previewPath, previewBlob);

    if (error) throw error;

    console.log("Preview uploaded successfully");
    return { success: true };
  } catch (error) {
    console.error("Error uploading preview:", error);
    return { success: false, error: error.message };
  }
};

// Save resource metadata to database
export const saveResourceMetadata = async (resourceData) => {
  try {
    console.log("Saving resource metadata:", resourceData.title);
    
    const { error } = await supabase
      .from("resources")
      .insert(resourceData);

    if (error) throw error;

    console.log("Resource metadata saved successfully");
    return { success: true };
  } catch (error) {
    console.error("Error saving resource metadata:", error);
    return { success: false, error: error.message };
  }
};

// Helper function to crop canvas
const cropCanvas = (canvas, x, y, width, height) => {
  const cropped = document.createElement("canvas");
  const ctx = cropped.getContext("2d");
  cropped.width = width;
  cropped.height = height;
  ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(cropped, 0, 0);
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};

// Get price suggestions for user tier
export const getUserPriceSuggestions = (userTier) => {
  return getPriceSuggestions(userTier);
};

// Check if user can upload more resources
export const checkUserCanUpload = (uploadCount, userTier) => {
  return canUserUpload(uploadCount, userTier);
};
