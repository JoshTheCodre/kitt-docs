
import { supabase } from "@/lib/supabase";
import { getUserTier, getTierInfo, canUserUpload, getPriceSuggestions } from "@/lib/tier-system";
import { validateFile } from "./utils.js";

// Fetch user tier and upload info
export const fetchUserTierInfo = async (userId) => {
  try {
    console.log("Fetching user tier info for uploads:", userId);
    
    const tier = await getUserTier(userId);
    const tierInfo = getTierInfo(tier);
    
    console.log("User tier fetched:", tier, tierInfo.name);
    return { tier, tierInfo };
  } catch (error) {
    console.error("Error fetching user tier info:", error);
    return { tier: 1, tierInfo: getTierInfo(1) };
  }
};

// Fetch user upload count
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

// Generate preview image for files
export const generatePreviewImage = async (file) => {
  if (typeof window === "undefined") return null;
  
  console.log("Generating preview for file:", file.name, file.type);
  
  try {
    if (file.type === "application/pdf") {
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
      
      console.log("PDF preview generated successfully");
      return blob;
    } else if (file.type.startsWith("image/")) {
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
      
      console.log("Image preview generated successfully");
      return blob;
    }
    
    console.log("No preview needed for file type:", file.type);
    return null;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
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

// Upload resource with all metadata
export const uploadResource = async (userId, resourceData, file, previewBlob) => {
  try {
    console.log("Starting resource upload:", resourceData.title);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `resources/${fileName}`;

    let previewPath = null;

    // Upload preview if available
    if (previewBlob) {
      const previewFileName = `preview_${Date.now()}.jpg`;
      previewPath = `previews/${previewFileName}`;

      console.log("Uploading preview image...");
      const { error: previewUploadError } = await supabase.storage
        .from("previews")
        .upload(previewPath, previewBlob);
      
      if (previewUploadError) throw previewUploadError;
    }

    // Upload original file
    console.log("Uploading original file...");
    const { error: uploadError } = await supabase.storage
      .from("resources")
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;

    // Save metadata to database
    console.log("Saving resource metadata...");
    const { data, error: dbError } = await supabase.from("resources").insert({
      title: resourceData.title,
      description: resourceData.description,
      uploader_id: userId,
      department: resourceData.department,
      level: resourceData.level,
      price: Number.parseFloat(resourceData.price) || 0,
      tags: resourceData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      storage_path: filePath,
      file_type: file.type,
      preview_path: previewBlob ? previewPath : null,
    });

    if (dbError) throw dbError;

    console.log("Resource uploaded successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error uploading resource:", error);
    throw error;
  }
};

// Check if user can upload more resources
export const checkUploadPermissions = (uploadCount, userTier) => {
  const canUpload = canUserUpload(uploadCount, userTier);
  console.log("Upload permissions check:", { uploadCount, userTier, canUpload });
  return canUpload;
};

// Get price suggestions for user tier
export const getTierPriceSuggestions = (userTier) => {
  const suggestions = getPriceSuggestions(userTier);
  console.log("Price suggestions for tier", userTier, ":", suggestions);
  return suggestions;
};
