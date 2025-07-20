
"use client";

import React, { useState } from "react";
import { Download, Eye, FileText, Image, Video, Music, Archive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getFileIcon, 
  formatFileSize, 
  isImageFile, 
  isPDFFile, 
  isVideoFile,
  truncateFileName 
} from "@/functions/file-utils";

export default function FilePreview({ 
  resource, 
  onDownload, 
  canPreview = false 
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePreview = () => {
    if (canPreview) {
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload(resource);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPreviewContent = () => {
    if (!resource.storage_path) return null;

    if (isImageFile(resource.file_type)) {
      return (
        <img
          src={resource.storage_path}
          alt={resource.title}
          className="max-w-full max-h-96 object-contain rounded-lg"
        />
      );
    }

    if (isPDFFile(resource.file_type)) {
      return (
        <iframe
          src={resource.storage_path}
          className="w-full h-96 rounded-lg border"
          title="PDF Preview"
        />
      );
    }

    if (isVideoFile(resource.file_type)) {
      return (
        <video
          src={resource.storage_path}
          controls
          className="max-w-full max-h-96 rounded-lg"
        >
          Your browser does not support video playback.
        </video>
      );
    }

    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Preview not available</p>
          <p className="text-sm text-gray-500">Download to view this file</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="rounded-xl shadow-sm bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{getFileIcon(resource.file_type)}</span>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {truncateFileName(resource.title)}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {resource.file_type}
                    </Badge>
                    {resource.file_size && (
                      <span className="text-sm text-gray-500">
                        {formatFileSize(resource.file_size)}
                      </span>
                    )}
                  </div>
                  {resource.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {canPreview && (isImageFile(resource.file_type) || isPDFFile(resource.file_type) || isVideoFile(resource.file_type)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="h-8 px-3"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={handleDownload}
                    disabled={loading}
                    size="sm"
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {loading ? "..." : "Download"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">{resource.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="rounded-full h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {getPreviewContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
